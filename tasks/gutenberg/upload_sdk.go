package gutenberg

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"time"

	"github.com/onflow/cadence"

	"alexandria/overflow/tasks/gutenberg/sdksender"
)

type SDKBookUploadResult struct {
	BookTitle      string
	GutenbergID    int
	Uploaded       bool
	FailedSection  int
	FailedTxName   string
	LastTxID       string
	FailureMessage string
}

func readParagraphsFileRaw(filename string) ([]string, error) {
	f, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	scanner := bufio.NewScanner(f)
	paragraphs := make([]string, 0, 1024)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line != "" {
			paragraphs = append(paragraphs, line)
		}
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}
	return paragraphs, nil
}

func resolveSDKSectionTitle(cfg UploadConfig, section ChapterFile) string {
	title := fmt.Sprintf("Chapter %d", section.Index)
	if cfg.ChapterTitles != nil {
		if t, ok := cfg.ChapterTitles[section.Index]; ok {
			return t
		}
	}
	if !cfg.RepairUpload {
		return inferSectionTitle(section.Path, title)
	}
	return title
}

// maxChapterTxBytes is the safe byte budget for a single add_chapter transaction.
// Flow's hard limit is 1,500,000; we use 1,200,000 to leave room for encoding
// overhead (Cadence JSON wraps each string, plus the transaction envelope).
const maxChapterTxBytes = 1_200_000

// splitParagraphsForTx splits paragraphs into a first batch that fits within
// maxChapterTxBytes and an overflow slice.
// Each paragraph is estimated at len(p)*2 + 25 bytes (Cadence JSON encoding).
func splitParagraphsForTx(bookTitle, sectionTitle string, index int, paragraphs []string) (first []string, overflow []string) {
	// Base overhead: script body + tx envelope + fixed args
	used := 20_000 + len(bookTitle)*2 + len(sectionTitle)*2 + 20
	for i, p := range paragraphs {
		cost := len(p)*2 + 25
		if used+cost > maxChapterTxBytes {
			return paragraphs[:i], paragraphs[i:]
		}
		used += cost
	}
	return paragraphs, nil
}

func submitAddChapter(ctx context.Context, sender *sdksender.Sender, bookTitle, sectionTitle string, sectionIndex int, batch []string) sdksender.TxResult {
	cadenceParagraphs := make([]cadence.Value, 0, len(batch))
	for _, p := range batch {
		cadenceParagraphs = append(cadenceParagraphs, cadence.String(p))
	}
	return sender.Submit(ctx, sdksender.TxRequest{
		Name: "Admin/add_chapter",
		Args: []cadence.Value{
			cadence.String(bookTitle),
			cadence.String(sectionTitle),
			cadence.NewInt(sectionIndex),
			cadence.NewArray(cadenceParagraphs),
		},
	})
}

func UploadBookWithSDK(ctx context.Context, sender *sdksender.Sender, cfg UploadConfig, gutenbergID int, bookAlreadyOnChain bool) SDKBookUploadResult {
	runID := fmt.Sprintf("book-%d-%d", gutenbergID, time.Now().UnixMilli())
	res := SDKBookUploadResult{
		BookTitle:   cfg.BookTitle,
		GutenbergID: gutenbergID,
		Uploaded:    false,
	}
	// #region agent log
	debugLogSDKUpload(runID, "H4", "tasks/gutenberg/upload_sdk.go:UploadBookWithSDK", "book upload start", map[string]interface{}{
		"bookTitle":          cfg.BookTitle,
		"gutenbergID":        gutenbergID,
		"startIndex":         cfg.StartIndex,
		"maxSections":        cfg.MaxSections,
		"bookAlreadyOnChain": bookAlreadyOnChain,
	})
	// #endregion
	if cfg.StartIndex == 0 {
		cfg.StartIndex = 1
	}
	summary := cfg.Summary
	if strings.TrimSpace(summary) == "" {
		summary = defaultSummary
	}
	genre := cfg.Genre
	if strings.TrimSpace(genre) == "" {
		genre = "Nonfiction"
	}

	if bookAlreadyOnChain {
		// #region agent log
		debugLogSDKUpload(runID, "H5", "tasks/gutenberg/upload_sdk.go:UploadBookWithSDK", "skip add_book (batch existence)", map[string]interface{}{
			"bookTitle": cfg.BookTitle,
		})
		// #endregion
		if cfg.SkipChapterUploadIfBookExists && cfg.StartIndex <= 1 {
			res.Uploaded = true
			return res
		}
	} else {
		addBookReq := sdksender.TxRequest{
			Name: "Admin/add_book",
			Args: []cadence.Value{
				cadence.String(cfg.BookTitle),
				cadence.String(cfg.Author),
				cadence.String(genre),
				cadence.String(cfg.Edition),
				cadence.String(summary),
			},
		}
		// #region agent log
		debugLogSDKUpload(runID, "H5", "tasks/gutenberg/upload_sdk.go:UploadBookWithSDK", "optimistic add_book submit", map[string]interface{}{
			"bookTitle": cfg.BookTitle,
		})
		// #endregion
		txRes := sender.Submit(ctx, addBookReq)
		if txRes.Err != nil {
			lower := strings.ToLower(txRes.Err.Error())
			if strings.Contains(lower, "already in the library") {
				// #region agent log
				debugLogSDKUpload(runID, "H5", "tasks/gutenberg/upload_sdk.go:UploadBookWithSDK", "book already exists via add_book", map[string]interface{}{
					"bookTitle":    cfg.BookTitle,
					"skipChapters": cfg.SkipChapterUploadIfBookExists && cfg.StartIndex <= 1,
				})
				// #endregion
				if cfg.SkipChapterUploadIfBookExists && cfg.StartIndex <= 1 {
					res.Uploaded = true
					return res
				}
			} else {
				res.FailedTxName = addBookReq.Name
				res.FailureMessage = txRes.Err.Error()
				return res
			}
		}
		res.LastTxID = txRes.TxID.String()
	}

	sections, err := FindSections(cfg.BooksFolder, cfg.SectionFileRegex, cfg.StartIndex)
	if err != nil {
		res.FailureMessage = err.Error()
		return res
	}
	if len(sections) == 0 {
		res.FailureMessage = fmt.Sprintf("no section files in %s matching %s", cfg.BooksFolder, cfg.SectionFileRegex)
		return res
	}
	if cfg.MaxSections > 0 && len(sections) > cfg.MaxSections {
		sections = sections[:cfg.MaxSections]
	}

	for _, section := range sections {
		sectionTitle := resolveSDKSectionTitle(cfg, section)
		paragraphs, err := readParagraphsFileRaw(section.Path)
		if err != nil {
			res.FailedSection = section.Index
			res.FailureMessage = err.Error()
			return res
		}
		addNameReq := sdksender.TxRequest{
			Name: "Admin/add_chapter_name",
			Args: []cadence.Value{
				cadence.String(cfg.BookTitle),
				cadence.String(sectionTitle),
			},
		}
		nameRes := sender.Submit(ctx, addNameReq)
		if nameRes.Err != nil && !isChapterAlreadyExistsError(nameRes.Err) {
			res.FailedSection = section.Index
			res.FailedTxName = addNameReq.Name
			res.FailureMessage = nameRes.Err.Error()
			return res
		}
		res.LastTxID = nameRes.TxID.String()

		firstBatch, overflow := splitParagraphsForTx(cfg.BookTitle, sectionTitle, section.Index, paragraphs)

		// #region agent log
		rawBytes := 0
		for _, p := range paragraphs {
			rawBytes += len(p)
		}
		debugLog4fb16a(runID, "H1H2", "tasks/gutenberg/upload_sdk.go:add_chapter_preflight", "pre-submit chapter size", map[string]interface{}{
			"gutenbergID":    gutenbergID,
			"sectionIndex":   section.Index,
			"paragraphCount": len(paragraphs),
			"rawBytes":       rawBytes,
			"firstBatch":     len(firstBatch),
			"overflow":       len(overflow),
			"bookTitle":      cfg.BookTitle,
		})
		// #endregion

		chapterRes := submitAddChapter(ctx, sender, cfg.BookTitle, sectionTitle, section.Index, firstBatch)
		if chapterRes.Err != nil {
			// #region agent log
			debugLog4fb16a(runID, "H1H3H4", "tasks/gutenberg/upload_sdk.go:add_chapter_error", "add_chapter failed", map[string]interface{}{
				"gutenbergID":    gutenbergID,
				"sectionIndex":   section.Index,
				"paragraphCount": len(firstBatch),
				"rawBytes":       rawBytes,
				"error":          chapterRes.Err.Error(),
			})
			// #endregion
			res.FailedSection = section.Index
			res.FailedTxName = "Admin/add_chapter"
			res.FailureMessage = chapterRes.Err.Error()
			return res
		}
		res.LastTxID = chapterRes.TxID.String()

		if len(overflow) > 0 {
			res.FailedSection = section.Index
			res.FailureMessage = fmt.Sprintf(
				"section %d has %d overflow paragraphs; requires contract bulk-append (mark deferred_repair)",
				section.Index, len(overflow))
			return res
		}
	}

	res.Uploaded = true
	return res
}

// #region agent log
func debugLog4fb16a(runID, hypothesisID, location, message string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-4fb16a.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "4fb16a",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     location,
		"message":      message,
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, _ := json.Marshal(payload)
	_, _ = f.Write(append(b, '\n'))
}

// #endregion

func debugLogSDKUpload(runID, hypothesisID, location, message string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-e7c465.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "e7c465",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     location,
		"message":      message,
		"data":         data,
		"timestamp":    time.Now().UnixMilli(),
	}
	b, err := json.Marshal(payload)
	if err != nil {
		return
	}
	_, _ = f.Write(append(b, '\n'))
}

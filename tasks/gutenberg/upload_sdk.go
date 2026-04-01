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

		cadenceParagraphs := make([]cadence.Value, 0, len(paragraphs))
		for _, p := range paragraphs {
			cadenceParagraphs = append(cadenceParagraphs, cadence.String(p))
		}
		addChapterReq := sdksender.TxRequest{
			Name: "Admin/add_chapter",
			Args: []cadence.Value{
				cadence.String(cfg.BookTitle),
				cadence.String(sectionTitle),
				cadence.NewInt(section.Index),
				cadence.NewArray(cadenceParagraphs),
			},
		}
		chapterRes := sender.Submit(ctx, addChapterReq)
		if chapterRes.Err != nil {
			res.FailedSection = section.Index
			res.FailedTxName = addChapterReq.Name
			res.FailureMessage = chapterRes.Err.Error()
			return res
		}
		res.LastTxID = chapterRes.TxID.String()
	}

	res.Uploaded = true
	return res
}

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

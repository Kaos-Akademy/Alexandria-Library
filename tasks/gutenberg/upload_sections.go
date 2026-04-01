package gutenberg

import (
	"encoding/json"
	"fmt"
	"os"
	"strings"
	"sync"
	"time"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

func resolveSectionTitle(cfg UploadConfig, section ChapterFile) string {
	sectionTitle := fmt.Sprintf("Chapter %d", section.Index)
	if cfg.ChapterTitles != nil {
		if t, ok := cfg.ChapterTitles[section.Index]; ok {
			sectionTitle = t
		}
	} else if !cfg.RepairUpload {
		sectionTitle = inferSectionTitle(section.Path, sectionTitle)
	}
	return sectionTitle
}

// #region agent log
func debugLogTxPanic(runID, hypothesisID, message string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-e7c465.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "e7c465",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     "tasks/gutenberg/upload_sections.go",
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

// #endregion

// #region agent log
func safeTx(o *OverflowState, txName string, opts []OverflowInteractionOption, runID, hypothesisID string, sectionIndex int, proposerAlias string) (res *OverflowResult, panicErr error) {
	defer func() {
		if r := recover(); r != nil {
			panicErr = fmt.Errorf("panic while sending %s: %v", txName, r)
			debugLogTxPanic(runID, hypothesisID, "panic recovered in safeTx", map[string]interface{}{
				"txName":       txName,
				"sectionIndex": sectionIndex,
				"proposer":     proposerAlias,
				"panic":        fmt.Sprintf("%v", r),
			})
		}
	}()
	res = o.Tx(txName, opts...)
	return res, nil
}

// #endregion

func uploadOneSection(o *OverflowState, cfg UploadConfig, titleArg string, section ChapterFile, proposerAlias string, runID string) error {
	sectionTitle := resolveSectionTitle(cfg, section)
	debugLogUpload("title-infer", "H1", "resolved section title", map[string]interface{}{
		"bookTitle":     cfg.BookTitle,
		"sectionIndex":  section.Index,
		"sectionPath":   section.Path,
		"resolvedTitle": sectionTitle,
		"proposerAlias": proposerAlias,
	})
	// #region agent log
	debugLogTxPanic(runID, "H1", "uploadOneSection entry", map[string]interface{}{
		"sectionIndex":  section.Index,
		"sectionTitle":  sectionTitle,
		"proposerAlias": proposerAlias,
	})
	// #endregion

	color.Cyan("\nProcessing %s (index %d)", sectionTitle, section.Index)
	paragraphs, err := ReadParagraphsFile(section.Path)
	if err != nil {
		return err
	}
	fmt.Printf("Successfully loaded %d paragraphs from %s\n", len(paragraphs), section.Path)
	chTitleArg := EscapeForCadence(sectionTitle)

	nameOpts := []OverflowInteractionOption{
		WithSigner(cfg.Signer),
		WithArg("bookTitle", titleArg),
		WithArg("chapterTitle", chTitleArg),
	}
	chapterOpts := []OverflowInteractionOption{
		WithSigner(cfg.Signer),
		WithArg("bookTitle", titleArg),
		WithArg("chapterTitle", chTitleArg),
		WithArg("index", section.Index),
		WithArg("paragraphs", paragraphs),
	}
	if strings.TrimSpace(proposerAlias) != "" {
		nameOpts = append(nameOpts, WithProposer(proposerAlias))
		chapterOpts = append(chapterOpts, WithProposer(proposerAlias))
	}
	// #region agent log
	debugLogTxPanic(runID, "H2", "about to send add_chapter_name", map[string]interface{}{
		"sectionIndex": section.Index,
		"titleLen":     len(sectionTitle),
		"optsCount":    len(nameOpts),
		"proposer":     proposerAlias,
	})
	// #endregion

	color.Yellow("Adding section name on-chain: %s", sectionTitle)
	nameRes, panicErr := safeTx(o, "Admin/add_chapter_name", nameOpts, runID, "H5", section.Index, proposerAlias)
	if panicErr != nil {
		return panicErr
	}
	nameRes.Print()
	if nameRes != nil && nameRes.Err != nil && !isChapterAlreadyExistsError(nameRes.Err) {
		// #region agent log
		debugLogTxPanic(runID, "H3", "add_chapter_name returned error", map[string]interface{}{
			"sectionIndex": section.Index,
			"error":        nameRes.Err.Error(),
			"proposer":     proposerAlias,
		})
		// #endregion
		return fmt.Errorf("add_chapter_name %s: %w", sectionTitle, nameRes.Err)
	}
	if nameRes != nil && nameRes.Err != nil && isChapterAlreadyExistsError(nameRes.Err) {
		color.Yellow("Chapter name already on chain; continuing with content only.")
	}
	// #region agent log
	debugLogTxPanic(runID, "H4", "about to send add_chapter", map[string]interface{}{
		"sectionIndex": section.Index,
		"paragraphs":   len(paragraphs),
		"optsCount":    len(chapterOpts),
		"proposer":     proposerAlias,
	})
	// #endregion

	color.Yellow("Adding section content on-chain: %s (index %d)", sectionTitle, section.Index)
	chRes, panicErr := safeTx(o, "Admin/add_chapter", chapterOpts, runID, "H5", section.Index, proposerAlias)
	if panicErr != nil {
		return panicErr
	}
	chRes.Print()
	if chRes != nil && chRes.Err != nil {
		return fmt.Errorf("add_chapter %s (index %d): %w", sectionTitle, section.Index, chRes.Err)
	}
	return nil
}

func uploadSectionsSequential(o *OverflowState, cfg UploadConfig, titleArg string, sections []ChapterFile) error {
	start := time.Now()
	runID := fmt.Sprintf("sequential-%d", time.Now().UnixMilli())
	for _, section := range sections {
		if err := uploadOneSection(o, cfg, titleArg, section, "", runID); err != nil {
			return err
		}
	}
	color.Green("Sequential upload finished in %s", time.Since(start).Round(time.Millisecond))
	return nil
}

func uploadSectionsConcurrent(o *OverflowState, cfg UploadConfig, titleArg string, sections []ChapterFile) error {
	aliases := make([]string, 0, len(cfg.ProposerAliases))
	for _, alias := range cfg.ProposerAliases {
		if strings.TrimSpace(alias) != "" {
			aliases = append(aliases, strings.TrimSpace(alias))
		}
	}
	if len(aliases) == 0 {
		return uploadSectionsSequential(o, cfg, titleArg, sections)
	}
	// Runtime evidence shows overflow v2 panics internally when proposer aliases
	// use non-default keys (fee amount missing on failed tx responses). Until
	// this sender is migrated to flow-go-sdk, force a safe sequential fallback.
	if len(aliases) > 1 {
		runID := fmt.Sprintf("fallback-%d", time.Now().UnixMilli())
		debugLogTxPanic(runID, "H5", "concurrency fallback activated", map[string]interface{}{
			"aliases": len(aliases),
			"reason":  "overflow-proposer-key instability",
		})
		color.Yellow("Concurrent proposer mode is unstable in Overflow for non-default keys; using safe sequential mode.")
		return uploadSectionsSequential(o, cfg, titleArg, sections)
	}

	start := time.Now()
	runID := fmt.Sprintf("concurrent-%d", time.Now().UnixMilli())
	color.Cyan("Concurrent mode enabled with %d proposer aliases", len(aliases))
	// #region agent log
	debugLogTxPanic(runID, "H2", "uploadSectionsConcurrent setup", map[string]interface{}{
		"aliases":       len(aliases),
		"sectionsCount": len(sections),
		"network":       o.GetNetwork(),
	})
	// #endregion

	jobs := make(chan ChapterFile, len(sections))
	errCh := make(chan error, len(sections))
	var wg sync.WaitGroup

	for _, alias := range aliases {
		proposerAlias := alias
		wg.Add(1)
		go func() {
			defer wg.Done()
			workerOverflow := Overflow(WithNetwork(o.GetNetwork()))
			for section := range jobs {
				if err := uploadOneSection(workerOverflow, cfg, titleArg, section, proposerAlias, runID); err != nil {
					errCh <- fmt.Errorf("proposer=%s section=%d: %w", proposerAlias, section.Index, err)
					return
				}
			}
		}()
	}

	for _, section := range sections {
		jobs <- section
	}
	close(jobs)
	wg.Wait()
	close(errCh)

	if err := <-errCh; err != nil {
		return err
	}

	elapsed := time.Since(start).Round(time.Millisecond)
	tps := float64(len(sections)) / time.Since(start).Seconds()
	color.Green("Concurrent upload finished in %s (%.2f sections/sec)", elapsed, tps)
	return nil
}

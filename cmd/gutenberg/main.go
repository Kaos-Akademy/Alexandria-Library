package main

import (
	"context"
	"encoding/json"
	"flag"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"

	"alexandria/overflow/tasks/gutenberg"
	"alexandria/overflow/tasks/gutenberg/sdksender"
)

var (
	chapterNumericTitle = regexp.MustCompile(`(?i)^chapter\s+\d+$`)
	chapterRomanTitle   = regexp.MustCompile(`(?i)^chapter\s+[ivxlcdm]+$`)
	bookVolumeTitle     = regexp.MustCompile(`(?i)^(book|volume|part)\b`)
)

func main() {
	if len(os.Args) < 2 {
		fmt.Fprintf(os.Stderr, "usage: %s <upload|pipeline|pipeline-manifest|resplit-cache> [flags]\n", os.Args[0])
		os.Exit(1)
	}
	switch os.Args[1] {
	case "upload":
		uploadCmd(os.Args[2:])
	case "pipeline":
		pipelineCmd(os.Args[2:])
	case "pipeline-manifest":
		pipelineManifestCmd(os.Args[2:])
	case "resplit-cache":
		resplitCacheCmd(os.Args[2:])
	default:
		fmt.Fprintf(os.Stderr, "unknown command %q (supported: upload, pipeline, pipeline-manifest, resplit-cache)\n", os.Args[1])
		os.Exit(1)
	}
}

// #region agent log
func debugLogRepair(runID, hypothesisID, message string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-a97b1b.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "a97b1b",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     "cmd/gutenberg/main.go",
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

func chapterTitleForSection(cfg gutenberg.UploadConfig, sectionIndex int) string {
	chapterTitle := fmt.Sprintf("Chapter %d", sectionIndex)
	if cfg.ChapterTitles != nil {
		if t, ok := cfg.ChapterTitles[sectionIndex]; ok {
			chapterTitle = t
		}
	}
	return chapterTitle
}

func detectTitleConvention(titles []string) string {
	if len(titles) == 0 {
		return "none"
	}
	nNumeric := 0
	nRoman := 0
	nBookVolume := 0
	for _, t := range titles {
		tt := strings.TrimSpace(t)
		switch {
		case chapterNumericTitle.MatchString(tt):
			nNumeric++
		case chapterRomanTitle.MatchString(tt):
			nRoman++
		case bookVolumeTitle.MatchString(tt):
			nBookVolume++
		}
	}
	switch {
	case nNumeric == len(titles):
		return "chapter-number"
	case nRoman == len(titles):
		return "chapter-roman"
	case nBookVolume > 0:
		return "book/volume/part"
	default:
		return "mixed/custom"
	}
}

func fetchOnChainChapterTitles(o *OverflowState, cfg gutenberg.UploadConfig) ([]string, error) {
	titleArg := gutenberg.EscapeForCadence(cfg.BookTitle)
	res := o.Script("get_book_chapter_titles", WithArg("bookTitle", titleArg))
	if res == nil {
		return nil, fmt.Errorf("get_book_chapter_titles: nil result")
	}
	if res.Err != nil {
		return nil, res.Err
	}
	var titles []string
	if err := res.MarshalAs(&titles); err != nil {
		return nil, err
	}
	sort.Strings(titles)
	return titles, nil
}

func fetchOnChainChapterMeta(o *OverflowState, cfg gutenberg.UploadConfig, chapterTitle string) (map[string]int, error) {
	titleArg := gutenberg.EscapeForCadence(cfg.BookTitle)
	chTitleArg := gutenberg.EscapeForCadence(chapterTitle)
	res := o.Script("get_book_chapter_meta",
		WithArg("bookTitle", titleArg),
		WithArg("chapterTitle", chTitleArg),
	)
	if res == nil {
		return nil, fmt.Errorf("get_book_chapter_meta: nil result")
	}
	if res.Err != nil {
		return nil, res.Err
	}
	var meta map[string]int
	if err := res.MarshalAs(&meta); err != nil {
		return nil, err
	}
	return meta, nil
}

func readRawParagraphs(path string) ([]string, error) {
	b, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	lines := strings.Split(strings.ReplaceAll(string(b), "\r\n", "\n"), "\n")
	out := make([]string, 0, len(lines))
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		if t != "" {
			out = append(out, t)
		}
	}
	return out, nil
}

func analyzeRepairState(o *OverflowState, cfg gutenberg.UploadConfig) ([]string, []string, error) {
	sections, err := gutenberg.FindSections(cfg.BooksFolder, cfg.SectionFileRegex, 1)
	if err != nil {
		return nil, nil, fmt.Errorf("scan sections: %w", err)
	}
	localTitles := make([]string, 0, len(sections))
	localByTitle := map[string]gutenberg.ChapterFile{}
	for _, s := range sections {
		t := chapterTitleForSection(cfg, s.Index)
		localTitles = append(localTitles, t)
		localByTitle[t] = s
	}
	onChainTitles, err := fetchOnChainChapterTitles(o, cfg)
	if err != nil {
		return localTitles, nil, fmt.Errorf("fetch on-chain chapter titles: %w", err)
	}
	color.Cyan("  local sections: %d, on-chain chapter titles: %d", len(localTitles), len(onChainTitles))
	color.Cyan("  local title convention: %s, on-chain title convention: %s",
		detectTitleConvention(localTitles), detectTitleConvention(onChainTitles))
	switch {
	case len(onChainTitles) < len(localTitles):
		color.Yellow("  decision#1: on-chain has fewer chapter titles than source sections.")
	case len(onChainTitles) > len(localTitles):
		color.Yellow("  decision#1: on-chain has more chapter titles than source sections.")
	default:
		color.Green("  decision#1: chapter title count matches source sections.")
	}
	if detectTitleConvention(localTitles) != detectTitleConvention(onChainTitles) {
		color.Yellow("  decision#2: chapter title convention mismatch (source vs chain).")
	} else {
		color.Green("  decision#2: chapter title convention matches.")
	}
	// #region agent log
	debugLogRepair("repair-preflight", "H1", "title-count-and-convention", map[string]interface{}{
		"bookTitle":              cfg.BookTitle,
		"localCount":             len(localTitles),
		"onChainCount":           len(onChainTitles),
		"localTitleConvention":   detectTitleConvention(localTitles),
		"onChainTitleConvention": detectTitleConvention(onChainTitles),
	})
	// #endregion

	onChainSet := map[string]bool{}
	for _, t := range onChainTitles {
		onChainSet[t] = true
	}
	localSet := map[string]bool{}
	for _, t := range localTitles {
		localSet[t] = true
	}
	for _, t := range onChainTitles {
		if !localSet[t] {
			color.Yellow("  title mismatch: chain has extra %q not in local sections", t)
		}
	}
	for _, t := range localTitles {
		if !onChainSet[t] {
			color.Yellow("  title mismatch: local has %q but chain does not", t)
			continue
		}
		section := localByTitle[t]
		localParagraphs, err := readRawParagraphs(section.Path)
		if err != nil || len(localParagraphs) == 0 {
			continue
		}
		meta, err := fetchOnChainChapterMeta(o, cfg, t)
		if err != nil {
			continue
		}
		titleArg := gutenberg.EscapeForCadence(cfg.BookTitle)
		chTitleArg := gutenberg.EscapeForCadence(t)
		firstParaRes := o.Script("get_book_paragraph",
			WithArg("bookTitle", titleArg),
			WithArg("chapterTitle", chTitleArg),
			WithArg("paragraphIndex", 0),
		)
		firstPara := ""
		if firstParaRes != nil && firstParaRes.Err == nil {
			var p string
			if err := firstParaRes.MarshalAs(&p); err == nil {
				firstPara = p
			}
		}
		// #region agent log
		debugLogRepair("repair-preflight", "H2", "content-sample-compare", map[string]interface{}{
			"bookTitle":          cfg.BookTitle,
			"chapterTitle":       t,
			"localParagraphs":    len(localParagraphs),
			"onChainParagraphs":  meta["paragraphCount"],
			"firstParagraphSame": firstPara == localParagraphs[0],
		})
		// #endregion
	}
	return localTitles, onChainTitles, nil
}

func removeExistingChaptersForRepair(o *OverflowState, cfg gutenberg.UploadConfig, onChainTitles []string, removeNames bool) error {
	if len(onChainTitles) == 0 {
		return nil
	}
	titleArg := gutenberg.EscapeForCadence(cfg.BookTitle)
	for _, chapterTitle := range onChainTitles {
		chTitleArg := gutenberg.EscapeForCadence(chapterTitle)
		color.Yellow("  remove_chapter: %s", chapterTitle)
		res := o.Tx("Admin/remove_chapter",
			WithSigner(cfg.Signer),
			WithArg("bookTitle", titleArg),
			WithArg("chapterTitle", chTitleArg),
		)
		if res != nil && res.Err != nil {
			msg := strings.ToLower(res.Err.Error())
			if !strings.Contains(msg, "doesn't exists") && !strings.Contains(msg, "does not exist") {
				return fmt.Errorf("remove_chapter %s: %w", chapterTitle, res.Err)
			}
		}
		if removeNames {
			color.Yellow("  remove_chapter_name: %s", chapterTitle)
			nameRes := o.Tx("Admin/remove_chapter_name",
				WithSigner(cfg.Signer),
				WithArg("bookTitle", titleArg),
				WithArg("chapterTitle", chTitleArg),
			)
			if nameRes != nil && nameRes.Err != nil {
				msg := strings.ToLower(nameRes.Err.Error())
				if !strings.Contains(msg, "doesn't exists") && !strings.Contains(msg, "does not exist") {
					return fmt.Errorf("remove_chapter_name %s: %w", chapterTitle, nameRes.Err)
				}
			}
		}
	}
	// #region agent log
	debugLogRepair("repair-preflight", "H3", "remove-phase-finished", map[string]interface{}{
		"bookTitle":    cfg.BookTitle,
		"removedCount": len(onChainTitles),
		"removedNames": removeNames,
	})
	// #endregion
	return nil
}

// resplitCacheCmd re-runs the heuristic splitter for every books/pg-cache/<id>/pg<id>-source.txt
// (no manifest). Use after improving split.go to refresh all cached section files.
func resplitCacheCmd(args []string) {
	fs := flag.NewFlagSet("resplit-cache", flag.ExitOnError)
	cacheDir := fs.String("cache", "books/pg-cache", "cache root")
	skipLines := fs.Int("skip-lines", 0, "skip first N lines before chapter marks")
	onlyID := fs.Int("only-id", 0, "if set, only this gutenberg id")
	fs.Parse(args)

	absCache, err := filepath.Abs(*cacheDir)
	if err != nil {
		color.Red("cache: %v", err)
		os.Exit(1)
	}
	dirEnts, err := os.ReadDir(absCache)
	if err != nil {
		color.Red("read cache: %v", err)
		os.Exit(1)
	}

	n := 0
	for _, de := range dirEnts {
		if !de.IsDir() {
			continue
		}
		id, err := strconv.Atoi(de.Name())
		if err != nil {
			continue
		}
		if *onlyID > 0 && id != *onlyID {
			continue
		}
		raw := filepath.Join(absCache, de.Name(), fmt.Sprintf("pg%d-source.txt", id))
		if _, err := os.Stat(raw); err != nil {
			continue
		}
		entry := gutenberg.ManifestEntry{GutenbergID: id}
		color.Cyan("PG %d", id)
		res, err := gutenberg.SplitFileFromPath(raw, entry, absCache, *skipLines)
		if err != nil {
			color.Red("  split failed: %v", err)
			os.Exit(1)
		}
		color.Green("  → %d sections (confidence %.2f)", len(res.SectionPaths), res.Confidence)
		for _, w := range res.Warnings {
			color.Yellow("  warning: %s", w)
		}
		if res.NeedsReview {
			color.Yellow("  needs_review: section line count < %d", gutenberg.MinSectionLineCount)
		}
		n++
	}
	if n == 0 {
		color.Yellow("No pg-cache directories with pg<id>-source.txt matched.")
	} else {
		color.Green("\nResplit %d book(s).", n)
	}
}

func pipelineCmd(args []string) {
	fs := flag.NewFlagSet("pipeline", flag.ExitOnError)
	rawPath := fs.String("raw", "", "path to full Project Gutenberg .txt for one book")
	gutenbergID := fs.Int("gutenberg-id", 0, "Gutenberg eBook id (e.g. 1971)")
	cacheDir := fs.String("cache", "books/pg-cache", "cache root for output PG<id>_Section_*.txt")
	skipLines := fs.Int("skip-lines", 0, "skip first N lines before looking for chapter marks (TOC etc.)")
	fs.Parse(args)

	if strings.TrimSpace(*rawPath) == "" || *gutenbergID <= 0 {
		color.Red("-raw and -gutenberg-id are required")
		os.Exit(1)
	}
	entry := gutenberg.ManifestEntry{GutenbergID: *gutenbergID}
	res, err := gutenberg.SplitFileFromPath(*rawPath, entry, *cacheDir, *skipLines)
	if err != nil {
		color.Red("split: %v", err)
		os.Exit(1)
	}
	color.Green("Wrote %d section files (confidence %.2f)", len(res.SectionPaths), res.Confidence)
	for _, w := range res.Warnings {
		color.Yellow("warning: %s", w)
	}
	if res.NeedsReview {
		color.Yellow("needs_review: at least one section has fewer than %d lines", gutenberg.MinSectionLineCount)
	}
}

func pipelineManifestCmd(args []string) {
	fs := flag.NewFlagSet("pipeline-manifest", flag.ExitOnError)
	manifestPath := fs.String("manifest", "", "path to manifest JSON")
	cacheDir := fs.String("cache", "books/pg-cache", "cache root; writes <id>/PG*_Section_*.txt")
	skipLines := fs.Int("skip-lines", 0, "skip first N lines before chapter detection")
	fetch := fs.Bool("fetch", false, "download pg<id>-source.txt from Project Gutenberg when missing")
	onlyID := fs.Int("only-id", 0, "if set, only process this gutenberg_id")
	fs.Parse(args)

	if strings.TrimSpace(*manifestPath) == "" {
		color.Red("-manifest is required")
		os.Exit(1)
	}
	m, err := gutenberg.LoadManifest(*manifestPath)
	if err != nil {
		color.Red("manifest: %v", err)
		os.Exit(1)
	}
	absCache, err := filepath.Abs(*cacheDir)
	if err != nil {
		color.Red("cache path: %v", err)
		os.Exit(1)
	}

	n := 0
	for i, e := range m.Entries {
		if *onlyID > 0 && e.GutenbergID != *onlyID {
			continue
		}
		if !gutenberg.ShouldUploadManifestEntry(e) {
			// Allow re-splitting one book with -only-id even when status is needs_review.
			if *onlyID <= 0 || e.GutenbergID != *onlyID {
				continue
			}
		}
		n++
		dir := e.BooksDir(absCache)
		raw := filepath.Join(dir, fmt.Sprintf("pg%d-source.txt", e.GutenbergID))
		color.Cyan("[%d/%d] PG %d — %s", i+1, len(m.Entries), e.GutenbergID, e.Title)

		if _, statErr := os.Stat(raw); statErr != nil {
			if *fetch {
				color.Yellow("  fetching %s …", raw)
				if err := gutenberg.DownloadGutenbergPlainText(e.GutenbergID, raw); err != nil {
					color.Red("  download failed: %v", err)
					os.Exit(1)
				}
			} else {
				color.Yellow("  skip (no %s; use -fetch)", raw)
				continue
			}
		}
		res, err := gutenberg.SplitFileFromPath(raw, e, absCache, *skipLines)
		if err != nil {
			color.Red("  split failed: %v", err)
			os.Exit(1)
		}
		color.Green("  → %d sections (confidence %.2f)", len(res.SectionPaths), res.Confidence)
		for _, w := range res.Warnings {
			color.Yellow("  warning: %s", w)
		}
		if res.NeedsReview {
			m.Entries[i].Status = "needs_review"
			m.Entries[i].SplitConfidence = res.Confidence
			if err := gutenberg.SaveManifest(*manifestPath, m); err != nil {
				color.Red("  could not save manifest (needs_review): %v", err)
			} else {
				color.Yellow("  manifest updated: status=needs_review (section line count < %d)", gutenberg.MinSectionLineCount)
			}
		}
	}
	if n == 0 {
		color.Yellow("No manifest entries with status=split matched (use -only-id to test one book).")
	}
}

func uploadCmd(args []string) {
	fs := flag.NewFlagSet("upload", flag.ExitOnError)
	manifestPath := fs.String("manifest", "", "path to manifest JSON (e.g. tasks/gutenberg/manifests/philosophy.json)")
	network := fs.String("network", "mainnet", "Flow network")
	cacheDir := fs.String("cache", "books/pg-cache", "cache root containing <gutenberg_id>/PG*_Section_*.txt")
	signer := fs.String("signer", "Prime-librarian", "Overflow signer account name")
	uploader := fs.String("uploader", "overflow", "uploader mode: overflow|sdk")
	bookConcurrency := fs.Int("book-concurrency", 25, "book-level concurrency for sdk uploader mode")
	repair := fs.Bool("repair", false, "re-upload all chapters when the book already exists (use after re-splitting cached sections)")
	removeFirst := fs.Bool("remove-first", false, "when used with -repair, remove existing chapter content on-chain before re-upload")
	onlyID := fs.Int("only-id", 0, "if set, only upload this gutenberg_id (must have status=split in the manifest)")
	proposers := fs.String("proposers", "", "comma-separated proposer aliases from flow.json (same address allowed, different key indexes)")
	proposerAliases := fs.String("proposer-aliases", "", "sdk mode proposer aliases from flow.json (comma-separated)")
	proposerKeyCount := fs.Int("proposer-key-count", 0, "sdk mode proposer count using <signer>,<signer>-p1.. pattern")
	spikeSections := fs.Int("spike-sections", 0, "optional limit for first N sections per book (for throughput spike testing)")
	launchStaggerMs := fs.Int("launch-stagger-ms", 10, "delay between starting each book upload goroutine (sdk mode)")
	maxBookRetries := fs.Int("max-book-retries", 3, "inline retries per book on retryable tx failures before marking split (sdk mode)")
	fs.Parse(args)

	if strings.TrimSpace(*manifestPath) == "" {
		color.Red("-manifest is required")
		os.Exit(1)
	}

	m, err := gutenberg.LoadManifest(*manifestPath)
	if err != nil {
		color.Red("manifest: %v", err)
		os.Exit(1)
	}

	absCache, err := filepath.Abs(*cacheDir)
	if err != nil {
		color.Red("cache path: %v", err)
		os.Exit(1)
	}

	color.Cyan("Manifest: %s", *manifestPath)
	color.Cyan("Cache dir: %s", absCache)
	color.Cyan("Signer: %s", *signer)
	color.Cyan("Uploader: %s", strings.ToLower(strings.TrimSpace(*uploader)))
	if strings.TrimSpace(*proposerAliases) != "" {
		color.Cyan("Proposer aliases: %s", strings.TrimSpace(*proposerAliases))
	} else if *proposerKeyCount > 0 {
		color.Cyan("Proposer key count: %d", *proposerKeyCount)
	} else if strings.TrimSpace(*proposers) != "" {
		color.Cyan("Proposers: %s", strings.TrimSpace(*proposers))
	}
	if strings.EqualFold(strings.TrimSpace(*uploader), "sdk") {
		color.Cyan("Book concurrency: %d", *bookConcurrency)
		color.Cyan("Launch stagger: %dms", *launchStaggerMs)
		color.Cyan("Max book retries: %d", *maxBookRetries)
	}
	if *spikeSections > 0 {
		color.Cyan("Spike sections: %d", *spikeSections)
	}
	color.Cyan("")

	total := 0
	for _, e := range m.Entries {
		if gutenberg.ShouldUploadManifestEntry(e) {
			total++
		}
	}
	color.Green("Entries with status=split: %d (of %d total)\n", total, len(m.Entries))

	proposerList := parseCSV(*proposerAliases)
	if len(proposerList) == 0 && *proposerKeyCount > 0 {
		proposerList = buildSignerProposerAliases(*signer, *proposerKeyCount)
	}
	if len(proposerList) == 0 {
		proposerList = parseCSV(*proposers)
	}

	if strings.EqualFold(strings.TrimSpace(*uploader), "sdk") {
		if *removeFirst {
			color.Red("sdk uploader does not support -remove-first yet")
			os.Exit(1)
		}
		if *bookConcurrency <= 0 {
			color.Red("-book-concurrency must be > 0 in sdk mode")
			os.Exit(1)
		}
		repoRoot, err := filepath.Abs(".")
		if err != nil {
			color.Red("repo root: %v", err)
			os.Exit(1)
		}
		sender, err := sdksender.NewSender(repoRoot, *network, *signer, proposerList)
		if err != nil {
			color.Red("sdk sender: %v", err)
			os.Exit(1)
		}
		defer sender.Close()
		// #region agent log
		sdksender.DebugLog("H2", "main.go:upload", "sdk upload session start", map[string]interface{}{
			"bookConcurrency": *bookConcurrency, "proposerKeyCount": len(proposerList),
			"launchStaggerMs": *launchStaggerMs, "manifest": *manifestPath,
		})
		// #endregion

		type job struct {
			Entry gutenberg.ManifestEntry
			Index int
		}
		type result struct {
			Entry  gutenberg.ManifestEntry
			Index  int
			Upload gutenberg.SDKBookUploadResult
		}

		jobs := make([]job, 0, len(m.Entries))
		for i, e := range m.Entries {
			if *onlyID > 0 && e.GutenbergID != *onlyID {
				continue
			}
			if !gutenberg.ShouldUploadManifestEntry(e) {
				if *onlyID > 0 && e.GutenbergID == *onlyID {
					color.Red("PG %d is in the manifest but status=%q (need \"split\" to upload)", e.GutenbergID, e.Status)
					os.Exit(1)
				}
				continue
			}
			jobs = append(jobs, job{Entry: e, Index: i})
		}
		if *onlyID > 0 && len(jobs) == 0 {
			color.Red("No manifest entry with gutenberg_id=%d (or it is not status=split).", *onlyID)
			os.Exit(1)
		}
		if len(jobs) == 0 {
			color.Yellow("No split entries selected for sdk upload.")
			return
		}

		titlesInOrder := make([]string, 0, len(jobs))
		for _, j := range jobs {
			cfg := gutenberg.UploadConfigFromManifest(j.Entry, absCache, *signer)
			titlesInOrder = append(titlesInOrder, cfg.BookTitle)
		}
		batchCtx, batchCancel := context.WithTimeout(context.Background(), 10*time.Minute)
		// #region agent log
		preflightStart := time.Now()
		sdksender.DebugLog("H5", "main.go:upload", "preflight BooksExistBatch start", map[string]interface{}{
			"titleCount": len(titlesInOrder),
		})
		// #endregion
		flags, err := sender.BooksExistBatch(batchCtx, titlesInOrder)
		batchCancel()
		// #region agent log
		sdksender.DebugLog("H5", "main.go:upload", "preflight BooksExistBatch done", map[string]interface{}{
			"titleCount": len(titlesInOrder), "durationMs": time.Since(preflightStart).Milliseconds(),
			"preflightErr": errString(err),
		})
		// #endregion
		if err != nil {
			color.Red("sdk batch book existence preflight: %v", err)
			os.Exit(1)
		}
		existByTitle := make(map[string]bool, len(titlesInOrder))
		for i, t := range titlesInOrder {
			existByTitle[t] = flags[i]
		}
		color.Cyan("SDK preflight: on-chain book storage checked for %d title(s) (batched scripts).\n", len(titlesInOrder))

		// Storage write probe: one synchronous upload before launching the pool.
		// Runtime evidence: Prime-librarian fails FlowStorageFees checks even at concurrency 1.
		if len(jobs) > 0 {
			probe := jobs[0]
			probeCfg := gutenberg.UploadConfigFromManifest(probe.Entry, absCache, *signer)
			probeCfg.MaxSections = *spikeSections
			if *repair {
				probeCfg.SkipChapterUploadIfBookExists = false
				probeCfg.RepairUpload = true
			}
			probeOnChain := existByTitle[probeCfg.BookTitle]
			color.Cyan("Storage write probe: testing Admin/add_book on PG %d before batch...", probe.Entry.GutenbergID)
			probeRes := gutenberg.UploadBookWithSDK(context.Background(), sender, probeCfg, probe.Entry.GutenbergID, probeOnChain)
			probeClass := sdksender.ClassifyError(fmt.Errorf("%s", probeRes.FailureMessage))
			// #region agent log
			sdksender.DebugLog("H1", "main.go:upload", "storage write probe result", map[string]interface{}{
				"gutenbergId": probe.Entry.GutenbergID, "uploaded": probeRes.Uploaded,
				"errorClass": probeClass, "tx": probeRes.FailedTxName,
				"errSnippet": truncateDebugErr(probeRes.FailureMessage, 200),
			})
			// #endregion
			if probeRes.Uploaded {
				color.Green("Uploaded [probe] %s (PG %d) lastTx=%s", probe.Entry.Title, probe.Entry.GutenbergID, probeRes.LastTxID)
				m.Entries[probe.Index].Status = "uploaded"
				if err := gutenberg.SaveManifest(*manifestPath, m); err != nil {
					color.Yellow("  warning: could not persist probe upload PG %d: %v", probe.Entry.GutenbergID, err)
				}
				jobs = jobs[1:]
			} else if probeClass == "storage_computation" && probeRes.FailedTxName == "Admin/add_book" {
				color.Red("\nUPLOAD BLOCKED: Prime-librarian (0xfed1adffd14ea9d0) cannot pass Flow storage fee checks.")
				color.Red("  FlowStorageFees computation exceeds limit during Admin/add_book.")
				color.Red("  Account has ~14.5k FLOW / ~3 GB used — not a balance issue; the account is too large for tx validation.")
				color.Red("  Fix: contact Flow support OR deploy a new librarian account. Lowering concurrency will not help.")
				// #region agent log
				sdksender.DebugLog("H1", "main.go:upload", "batch aborted at storage wall", map[string]interface{}{
					"remainingJobs": len(jobs), "exitCode": 2,
				})
				// #endregion
				os.Exit(2)
			}
		}
		if len(jobs) == 0 {
			color.Green("\nDone: probe uploaded all selected split entries.")
			return
		}

		// Spawn uploads in a background goroutine so the main goroutine can consume
		// results immediately. Otherwise the launch loop blocks on sem after
		// bookConcurrency workers start, and for r := range results does not run
		// until (len(jobs) - bookConcurrency) books finish — no terminal output until then.
		sem := make(chan struct{}, *bookConcurrency)
		results := make(chan result, len(jobs))
		var wg sync.WaitGroup
		go func() {
			for _, j := range jobs {
				wg.Add(1)
				sem <- struct{}{}
				if *launchStaggerMs > 0 {
					time.Sleep(time.Duration(*launchStaggerMs) * time.Millisecond)
				}
				item := j
				go func() {
					defer wg.Done()
					defer func() { <-sem }()
					cfg := gutenberg.UploadConfigFromManifest(item.Entry, absCache, *signer)
					cfg.MaxSections = *spikeSections
					if *repair {
						cfg.SkipChapterUploadIfBookExists = false
						cfg.RepairUpload = true
					}
					onChain := existByTitle[cfg.BookTitle]
					up := uploadBookWithSDKRetries(context.Background(), sender, cfg, item.Entry.GutenbergID, onChain, *maxBookRetries)
					results <- result{Entry: item.Entry, Index: item.Index, Upload: up}
				}()
			}
			wg.Wait()
			close(results)
		}()

		color.Cyan("SDK upload: %d book(s), concurrency=%d — streaming results as each book finishes.\n", len(jobs), *bookConcurrency)
		failures := 0
		failByClass := map[string]int{}
		for r := range results {
			if r.Upload.Uploaded {
				color.Green("Uploaded [%d/%d] %s (PG %d) lastTx=%s", r.Index+1, len(m.Entries), r.Entry.Title, r.Entry.GutenbergID, r.Upload.LastTxID)
				m.Entries[r.Index].Status = "uploaded"
				if err := gutenberg.SaveManifest(*manifestPath, m); err != nil {
					color.Yellow("  warning: could not persist status=uploaded for PG %d: %v", r.Entry.GutenbergID, err)
				}
				continue
			}
			failures++
			errClass := sdksender.ClassifyError(fmt.Errorf("%s", r.Upload.FailureMessage))
			failByClass[errClass]++
			// #region agent log
			sdksender.DebugLog("H1-H3", "main.go:upload", "book upload failed", map[string]interface{}{
				"gutenbergId": r.Entry.GutenbergID, "tx": r.Upload.FailedTxName,
				"section": r.Upload.FailedSection, "errorClass": errClass,
				"errSnippet": truncateDebugErr(r.Upload.FailureMessage, 200),
			})
			// #endregion
			color.Red("Failed [%d/%d] %s (PG %d) section=%d tx=%s err=%s",
				r.Index+1, len(m.Entries), r.Entry.Title, r.Entry.GutenbergID,
				r.Upload.FailedSection, r.Upload.FailedTxName, r.Upload.FailureMessage)
		}
		// #region agent log
		sdksender.DebugLog("H1-H5", "main.go:upload", "sdk upload session summary", map[string]interface{}{
			"totalJobs": len(jobs), "failures": failures, "failByClass": failByClass,
		})
		// #endregion
		if failures > 0 {
			color.Red("\nSDK upload completed with %d failed book(s).", failures)
			os.Exit(1)
		}
		color.Green("\nDone: sdk upload processed all selected split entries.")
		return
	}

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork(*network),
	)

	uploaded := 0
	for i, e := range m.Entries {
		if *onlyID > 0 && e.GutenbergID != *onlyID {
			continue
		}
		if !gutenberg.ShouldUploadManifestEntry(e) {
			if *onlyID > 0 && e.GutenbergID == *onlyID {
				color.Red("PG %d is in the manifest but status=%q (need \"split\" to upload)", e.GutenbergID, e.Status)
				os.Exit(1)
			}
			color.Yellow("Skipping [%d/%d] %s (status=%q)", i+1, len(m.Entries), e.Title, e.Status)
			continue
		}
		color.Green("\n=== Uploading [%d/%d] %s (PG %d) ===", i+1, len(m.Entries), e.Title, e.GutenbergID)
		cfg := gutenberg.UploadConfigFromManifest(e, absCache, *signer)
		cfg.ProposerAliases = proposerList
		cfg.MaxSections = *spikeSections
		if *repair {
			cfg.SkipChapterUploadIfBookExists = false
			// Without -remove-first: keep "Chapter N" keys; add_chapter_name still runs (new slots register).
			cfg.RepairUpload = !*removeFirst
			_, onChainTitles, err := analyzeRepairState(o, cfg)
			if err != nil {
				color.Red("Repair preflight failed for %s: %v", e.Title, err)
				os.Exit(1)
			}
			if *removeFirst {
				color.Cyan("Repair mode: removing existing chapters + chapter names before upload...")
				if err := removeExistingChaptersForRepair(o, cfg, onChainTitles, true); err != nil {
					color.Red("Pre-remove failed for %s: %v", e.Title, err)
					os.Exit(1)
				}
				cfg.RepairUpload = false
			}
		}
		if err := gutenberg.UploadBook(o, cfg); err != nil {
			color.Red("Upload failed for %s: %v", e.Title, err)
			os.Exit(1)
		}
		uploaded++
	}
	if *onlyID > 0 && uploaded == 0 {
		color.Red("No manifest entry with gutenberg_id=%d (or it is not status=split).", *onlyID)
		os.Exit(1)
	}
	color.Green("\nDone: processed all split entries.")
}

func uploadBookWithSDKRetries(ctx context.Context, sender *sdksender.Sender, cfg gutenberg.UploadConfig, gutenbergID int, onChain bool, maxRetries int) gutenberg.SDKBookUploadResult {
	if maxRetries < 0 {
		maxRetries = 0
	}
	attempts := maxRetries + 1
	var last gutenberg.SDKBookUploadResult
	for attempt := 1; attempt <= attempts; attempt++ {
		last = gutenberg.UploadBookWithSDK(ctx, sender, cfg, gutenbergID, onChain)
		if last.Uploaded {
			return last
		}
		if attempt == attempts {
			break
		}
		if last.FailedTxName == "Admin/add_book" ||
			strings.Contains(strings.ToLower(last.FailureMessage), "overflow paragraphs") {
			break
		}
		if !sdksender.RetryableError(fmt.Errorf("%s", last.FailureMessage)) {
			break
		}
		if last.FailedTxName != "" && last.FailedTxName != "Admin/add_book" {
			onChain = true
		}
		select {
		case <-ctx.Done():
			last.FailureMessage = ctx.Err().Error()
			return last
		case <-time.After(sdksender.RetryBackoff(attempt)):
		}
	}
	return last
}

func parseCSV(value string) []string {
	if strings.TrimSpace(value) == "" {
		return nil
	}
	parts := strings.Split(value, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		t := strings.TrimSpace(p)
		if t != "" {
			out = append(out, t)
		}
	}
	return out
}

func errString(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func truncateDebugErr(s string, max int) string {
	if len(s) <= max {
		return s
	}
	return s[:max] + "..."
}

func buildSignerProposerAliases(signer string, count int) []string {
	if strings.TrimSpace(signer) == "" || count <= 0 {
		return nil
	}
	out := make([]string, 0, count)
	out = append(out, signer)
	for i := 1; i < count; i++ {
		out = append(out, fmt.Sprintf("%s-p%d", signer, i))
	}
	return out
}

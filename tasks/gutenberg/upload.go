package gutenberg

import (
	"encoding/json"
	"fmt"
	"os"
	"regexp"
	"strings"
	"time"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

const defaultSummary = "A public domain work from Project Gutenberg."

var sectionHeadingLine = regexp.MustCompile(`(?i)^(chapter|part|book|volume)\s+[ivxlcdm0-9]+(?:[\.\:\-\s]|$)`)

// #region agent log
func debugLogUpload(runID, hypothesisID, message string, data map[string]interface{}) {
	f, err := os.OpenFile("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/.cursor/debug-a97b1b.log", os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
	if err != nil {
		return
	}
	defer f.Close()
	payload := map[string]interface{}{
		"sessionId":    "a97b1b",
		"runId":        runID,
		"hypothesisId": hypothesisID,
		"location":     "tasks/gutenberg/upload.go",
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

func isChapterAlreadyExistsError(err error) bool {
	if err == nil {
		return false
	}
	s := strings.ToLower(err.Error())
	return strings.Contains(s, "already exists") || strings.Contains(s, "chapter already")
}

func inferSectionTitle(sectionPath, fallback string) string {
	b, err := os.ReadFile(sectionPath)
	if err != nil {
		return fallback
	}
	lines := strings.Split(strings.ReplaceAll(string(b), "\r\n", "\n"), "\n")
	for _, ln := range lines {
		t := strings.TrimSpace(ln)
		if t == "" {
			continue
		}
		if sectionHeadingLine.MatchString(t) {
			return t
		}
		// If the first meaningful line is body text, stop scanning.
		if len(t) > 40 || strings.ContainsAny(t, ",;") {
			break
		}
	}
	return fallback
}

// UploadConfig is the on-chain upload configuration for one book.
type UploadConfig struct {
	BookTitle        string
	Author           string
	Genre            string
	Edition          string
	Summary          string
	SectionFileRegex string
	BooksFolder      string
	Signer           string
	StartIndex       int
	ChapterTitles    map[int]string
	// SkipChapterUploadIfBookExists: when true (manifest batch), if get_book finds the book,
	// return immediately and do not run add_chapter_name/add_chapter. When false (e.g. tasks/main.go),
	// existing books still get chapter txs (legacy single-book upload / repair).
	SkipChapterUploadIfBookExists bool
	// RepairUpload: re-upload into an existing book without -remove-first. Use canonical "Chapter N"
	// keys (no inferSectionTitle) so names match chapterNames on-chain; add_chapter_name is still
	// sent every time—"already exists" is ignored, and new indices (e.g. Chapter 5) get registered.
	RepairUpload bool
	// ProposerAliases: optional proposer account aliases from flow.json (same address allowed, different key index).
	// When set, uploads run through a worker pool with one worker per proposer alias.
	ProposerAliases []string
	// MaxSections: optional spike-mode limiter for uploads. 0 means all matched sections.
	MaxSections int
}

// UploadBook runs add_book (if needed), then add_chapter_name + add_chapter for each section file.
func UploadBook(o *OverflowState, cfg UploadConfig) error {
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

	color.Red("Alexandria Contract - %s Upload", cfg.BookTitle)
	color.Red("")

	titleArg := EscapeForCadence(cfg.BookTitle)
	authorArg := EscapeForCadence(cfg.Author)
	genreArg := EscapeForCadence(genre)
	editionArg := EscapeForCadence(cfg.Edition)

	color.Cyan("Checking if book already exists...")
	bookExists := false
	bookResult := o.Script("get_book", WithArg("bookTitle", titleArg))
	if bookResult != nil && bookResult.Err == nil {
		bookExists = true
	}
	if bookExists {
		if cfg.SkipChapterUploadIfBookExists && cfg.StartIndex <= 1 {
			color.Green("Book already exists on chain. Skipping all chapter uploads for this title.")
			return nil
		}
		color.Green("Book already exists. Skipping book creation.")
		if cfg.StartIndex > 1 {
			color.Yellow("Resuming upload from section index %d onward.", cfg.StartIndex)
		}
	} else {
		color.Yellow("Book does not exist. Creating book: %s", cfg.BookTitle)
		result := o.Tx("Admin/add_book",
			WithSigner(cfg.Signer),
			WithArg("title", titleArg),
			WithArg("author", authorArg),
			WithArg("genre", genreArg),
			WithArg("edition", editionArg),
			WithArg("summary", EscapeForCadence(summary)),
		)
		if result.Err != nil && strings.Contains(result.Err.Error(), "already in the Library") {
			if cfg.SkipChapterUploadIfBookExists && cfg.StartIndex <= 1 {
				color.Green("Book already exists (detected during add_book). Skipping all chapter uploads.")
				return nil
			}
			color.Green("Book already exists (detected during creation). Skipping.")
		} else if result.Err != nil {
			return result.Err
		} else {
			result.Print()
			color.Green("Book created successfully!")
		}
	}

	sectionFiles, err := FindSections(cfg.BooksFolder, cfg.SectionFileRegex, cfg.StartIndex)
	if err != nil {
		return err
	}
	if len(sectionFiles) == 0 {
		return fmt.Errorf("no section files in %s matching %s", cfg.BooksFolder, cfg.SectionFileRegex)
	}
	if cfg.MaxSections > 0 && len(sectionFiles) > cfg.MaxSections {
		sectionFiles = sectionFiles[:cfg.MaxSections]
		color.Yellow("Spike mode: limiting upload to first %d sections", len(sectionFiles))
	}
	fmt.Printf("\nFound %d section files:\n", len(sectionFiles))
	for _, section := range sectionFiles {
		fmt.Printf("  - %s (index %d)\n", section.Path, section.Index)
	}

	if len(cfg.ProposerAliases) > 0 {
		if err := uploadSectionsConcurrent(o, cfg, titleArg, sectionFiles); err != nil {
			return err
		}
	} else {
		if err := uploadSectionsSequential(o, cfg, titleArg, sectionFiles); err != nil {
			return err
		}
	}
	color.Green("\nFinished uploading %s sections.", cfg.BookTitle)
	return nil
}

// UploadConfigFromManifest builds UploadConfig from a manifest entry and cache layout.
func UploadConfigFromManifest(entry ManifestEntry, cacheDir string, signer string) UploadConfig {
	entry.EnsureSectionPrefix()
	edition := entry.Edition
	if strings.TrimSpace(edition) == "" {
		edition = fmt.Sprintf("Project Gutenberg eBook #%d", entry.GutenbergID)
	}
	title := entry.Title
	if strings.TrimSpace(title) == "" {
		title = fmt.Sprintf("Gutenberg %d", entry.GutenbergID)
	}
	author := strings.TrimSpace(entry.Author)
	if author == "" {
		author = "Unknown"
	}
	startIdx := 1
	if entry.ResumeFromSection > 0 {
		startIdx = entry.ResumeFromSection
	}
	return UploadConfig{
		BookTitle:                     title,
		Author:                        author,
		Genre:                         entry.Genre,
		Edition:                       edition,
		Summary:                       entry.Summary,
		SectionFileRegex:              entry.SectionFileRegex(),
		BooksFolder:                   entry.BooksDir(cacheDir),
		Signer:                        signer,
		StartIndex:                    startIdx,
		ChapterTitles:                 nil,
		SkipChapterUploadIfBookExists: true,
		RepairUpload:                  false,
	}
}

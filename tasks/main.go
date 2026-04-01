package main

import (
	"os"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"

	"alexandria/overflow/tasks/gutenberg"
)

func main() {
	// --- Hardcoded book config: change these when switching to another book ---
	const (
		bookTitle        = "Ethics"
		author           = "Benedictus de Spinoza"
		genre            = "Philosophy"
		edition          = "Project Gutenberg eBook #3800"
		summary          = "\"Ethics\" by Benedictus de Spinoza is a philosophical treatise written between 1661 and 1675. Using Euclid's geometric method, Spinoza constructs a radical philosophical system from definitions and axioms, deriving propositions about God, nature, mind, and human emotion. He argues that God and the universe are one, that mind and body are unified, and that human beings lack free will. Through logical demonstration, Spinoza presents a deterministic vision where everything follows necessarily from the nature of existence itself."
		sectionFileRegex = `^Ethics_Section_(\d+)\.txt$`
		booksFolder      = "books"
		signer           = "Prime-librarian"
		startIndex       = 1
	)
	var chapterTitles map[int]string = map[int]string{
		1: "Part I — Concerning God",
		2: "Part II — On the Nature and Origin of the Mind",
		3: "Part III — On the Origin and Nature of the Emotions",
		4: "Part IV — Of Human Bondage, or the Strength of the Emotions",
		5: "Part V — Of the Power of the Understanding, or of Human Freedom",
	}
	// ---------------------------------------------------------------------------

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	cfg := gutenberg.UploadConfig{
		BookTitle:        bookTitle,
		Author:           author,
		Genre:            genre,
		Edition:          edition,
		Summary:          summary,
		SectionFileRegex: sectionFileRegex,
		BooksFolder:      booksFolder,
		Signer:           signer,
		StartIndex:       startIndex,
		ChapterTitles:    chapterTitles,
	}
	if err := gutenberg.UploadBook(o, cfg); err != nil {
		color.Red("Upload failed: %v", err)
		os.Exit(1)
	}
}

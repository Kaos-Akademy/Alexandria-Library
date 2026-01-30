package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	//if you imports this with .  you do not have to repeat overflow everywhere
	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

// escapeForCadence escapes a string so it is valid inside a Cadence string literal.
// Cadence uses "..." for strings; inner " must be \" and \ must be \\.
func escapeForCadence(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case '\\':
			b.WriteString(`\\`)
		case '"':
			b.WriteString(`\"`)
		default:
			b.WriteRune(r)
		}
	}
	return b.String()
}

// ReadFile reads a text file and returns an array of paragraphs, each escaped for Cadence.
func ReadFile(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var content string
	scanner := bufio.NewScanner(file)

	// Read file content line by line
	for scanner.Scan() {
		content += scanner.Text() + "\n"
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	// Split the content into paragraphs
	// Assuming paragraphs are separated by one or more newlines
	rawParagraphs := strings.Split(content, "\n")
	paragraphs := make([]string, 0, len(rawParagraphs))

	for _, paragraph := range rawParagraphs {
		trimmed := strings.TrimSpace(paragraph)
		if trimmed != "" {
			paragraphs = append(paragraphs, escapeForCadence(trimmed)) // Escaped for Cadence [String]
		}
	}

	return paragraphs, nil
}

type chapterFile struct {
	Path  string
	Label string
	Index int
}

// findSections finds all section files in baseDir whose name matches sectionFileRegex
// (regex must have one submatch for the numeric index, e.g. `^Crime_Section_(\d+)\.txt$`).
// Returns sections sorted by index.
func findSections(baseDir, sectionFileRegex string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}
	re := regexp.MustCompile(sectionFileRegex)
	var sections []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		var index int
		fmt.Sscanf(m[1], "%d", &index)
		if index < minIndex {
			continue
		}
		sections = append(sections, chapterFile{
			Path:  filepath.Join(baseDir, e.Name()),
			Label: m[1],
			Index: index,
		})
	}
	sort.Slice(sections, func(i, j int) bool {
		return sections[i].Index < sections[j].Index
	})
	return sections, nil
}

func main() {
	// --- Hardcoded book config: change these when switching to another book ---
	const (
		bookTitle        = "Crime and Punishment"
		author           = "Fyodor Dostoyevsky"
		genre            = "Fiction"
		edition          = "Project Gutenberg eBook #2554"
		summary          = "Crime and Punishment is Fyodor Dostoyevsky's psychological novel about Raskolnikov, a destitute former student who plans and commits a murder, then grapples with guilt, alienation, and redemption in 1860s St. Petersburg. Translated by Constance Garnett."
		sectionFileRegex = `^Crime_Section_(\d+)\.txt$`
		booksFolder      = "books"
		signer           = "Prime-librarian"
		startIndex       = 1
	)
	// Optional: custom chapter titles by index (e.g. Gilgamesh: 1->"Introduction", 2->"Column I - Dreams of Gilgamesh").
	// Leave nil to use "Chapter 1", "Chapter 2", ...
	var chapterTitles map[int]string = nil
	// ---------------------------------------------------------------------------

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	color.Red("Alexandria Contract - %s Upload", bookTitle)
	color.Red("")

	color.Cyan("Checking if book already exists...")
	bookExists := false
	bookResult := o.Script("get_book", WithArg("bookTitle", bookTitle))
	if bookResult != nil && bookResult.Err == nil {
		bookExists = true
	}
	if !bookExists {
		color.Yellow("Book does not exist. Creating book: %s", bookTitle)
		result := o.Tx("Admin/add_book",
			WithSigner(signer),
			WithArg("title", bookTitle),
			WithArg("author", author),
			WithArg("genre", genre),
			WithArg("edition", edition),
			WithArg("summary", summary),
		)
		if result.Err != nil && strings.Contains(result.Err.Error(), "already in the Library") {
			color.Green("Book already exists (detected during creation). Skipping.")
		} else {
			result.Print()
			color.Green("Book created successfully!")
		}
	} else {
		color.Green("Book already exists. Skipping book creation.")
	}

	sectionFiles, err := findSections(booksFolder, sectionFileRegex, startIndex)
	if err != nil {
		fmt.Printf("Error discovering section files: %v\n", err)
		os.Exit(1)
	}
	if len(sectionFiles) == 0 {
		fmt.Printf("No section files found in %s matching %s\n", booksFolder, sectionFileRegex)
		return
	}
	fmt.Printf("\nFound %d section files:\n", len(sectionFiles))
	for _, section := range sectionFiles {
		fmt.Printf("  - %s (index %d)\n", section.Path, section.Index)
	}

	for _, section := range sectionFiles {
		sectionTitle := fmt.Sprintf("Chapter %d", section.Index)
		if chapterTitles != nil {
			if t, ok := chapterTitles[section.Index]; ok {
				sectionTitle = t
			}
		}
		color.Cyan("\nProcessing %s (index %d)", sectionTitle, section.Index)
		paragraphs, err := ReadFile(section.Path)
		if err != nil {
			fmt.Printf("Error reading %s: %v\n", section.Path, err)
			os.Exit(1)
		}
		fmt.Printf("Successfully loaded %d paragraphs from %s\n", len(paragraphs), section.Path)
		color.Yellow("Adding section name on-chain: %s", sectionTitle)
		o.Tx("Admin/add_chapter_name",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", sectionTitle),
		).Print()
		color.Yellow("Adding section content on-chain: %s (index %d)", sectionTitle, section.Index)
		o.Tx("Admin/add_chapter",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", sectionTitle),
			WithArg("index", section.Index),
			WithArg("paragraphs", paragraphs),
		).Print()
	}
	color.Green("\nFinished uploading %s sections.", bookTitle)
}

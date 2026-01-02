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

// ReadFile reads a text file and returns an array of paragraphs
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
			paragraphs = append(paragraphs, trimmed) // Add non-empty paragraphs
		}
	}

	return paragraphs, nil
}

// romanToInt converts a (simple) Roman numeral like "V", "XII", "XLII" to an int.
// This is more than enough for Huck Finn's chapter range.
func romanToInt(s string) int {
	values := map[byte]int{
		'I': 1,
		'V': 5,
		'X': 10,
		'L': 50,
		'C': 100,
		'D': 500,
		'M': 1000,
	}
	n := 0
	prev := 0
	for i := len(s) - 1; i >= 0; i-- {
		v := values[s[i]]
		if v < prev {
			n -= v
		} else {
			n += v
		}
		prev = v
	}
	return n
}

type chapterFile struct {
	Path  string
	Label string
	Index int
}

// findHuckChapters finds all Huck_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findHuckChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Huck_Chapter_([A-Z_]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "V", "VI", ..., "XLII", "THE_LAST"

		index := 0
		if label == "THE_LAST" {
			// Put "THE_LAST" logically at the end
			index = 999
		} else {
			index = romanToInt(label)
		}

		if index < minIndex {
			// Skip chapters before the requested starting point
			continue
		}

		chapters = append(chapters, chapterFile{
			Path:  filepath.Join(baseDir, e.Name()),
			Label: label,
			Index: index,
		})
	}

	// Sort by numeric index
	sort.Slice(chapters, func(i, j int) bool {
		return chapters[i].Index < chapters[j].Index
	})

	return chapters, nil
}

// formatChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "V" -> "Chapter V", "THE_LAST" -> "Chapter THE LAST"
func formatChapterTitle(label string) string {
	titleLabel := strings.ReplaceAll(label, "_", " ")
	return "Chapter " + titleLabel
}

func main() {

	// Config
	const (
		bookTitle   = "The adventures of Huckleberry Finn"
		startIndex  = 5       // Start from Chapter V (5)
		booksFolder = "books" // Relative to repo root when running `go run ./tasks/main.go`
		signer      = "Prime-librarian"
	)

	// Discover all Huck chapter files from V onward
	chapterFiles, err := findHuckChapters(booksFolder, startIndex)
	if err != nil {
		fmt.Printf("Error discovering Huck chapter files: %v\n", err)
		os.Exit(1)
	}

	if len(chapterFiles) == 0 {
		fmt.Println("No Huck_Chapter_*.txt files found from Chapter V onward")
		return
	}

	fmt.Printf("Found %d Huck chapter files from Chapter V onward:\n", len(chapterFiles))
	for _, ch := range chapterFiles {
		fmt.Printf("  - %s (index %d, label %s)\n", ch.Path, ch.Index, ch.Label)
	}

	// Set up Overflow
	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	fmt.Println("Testing Contract")
	/* 	fmt.Println("Press any key to continue")
	   	fmt.Scanln() */

	color.Red("Alexandria Contract testing")

	color.Red("")

	// Loop over all chapters from V to the last and upload them
	for _, ch := range chapterFiles {
		chapterTitle := formatChapterTitle(ch.Label)

		color.Cyan("\nProcessing %s (index %d)", chapterTitle, ch.Index)

		paragraphs, err := ReadFile(ch.Path)
		if err != nil {
			fmt.Printf("Error reading %s: %v\n", ch.Path, err)
			os.Exit(1)
		}

		fmt.Printf("Successfully loaded %d paragraphs from %s\n", len(paragraphs), ch.Path)

		// Add chapter title (name) if needed
		color.Yellow("Adding chapter name on-chain: %s", chapterTitle)
		o.Tx("Admin/add_chapter_name",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", chapterTitle),
		).Print()

		// Add the full chapter content
		color.Yellow("Adding chapter content on-chain: %s (index %d)", chapterTitle, ch.Index)
		o.Tx("Admin/add_chapter",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", chapterTitle),
			WithArg("index", ch.Index),
			WithArg("paragraphs", paragraphs),
		).Print()
	}

	color.Green("\nFinished uploading Huck Finn chapters from V to the last.")
}

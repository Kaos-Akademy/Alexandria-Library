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

// findOdysseyChapters finds all Odyssey_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findOdysseyChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Odyssey_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XXIV"

		index := romanToInt(label)

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

// formatOdysseyChapterTitle creates the on-chain chapterTitle from the file label for Odyssey.
// e.g. "I" -> "Book I", "XXIV" -> "Book XXIV"
func formatOdysseyChapterTitle(label string) string {
	return "Book " + label
}

// findOzChapters finds all Oz_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findOzChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Oz_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XXIV"

		index := romanToInt(label)

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

// formatOzChapterTitle creates the on-chain chapterTitle from the file label for Oz.
// e.g. "I" -> "Chapter I", "XXIV" -> "Chapter XXIV"
func formatOzChapterTitle(label string) string {
	return "Chapter " + label
}

// findDraculaChapters finds all Dracula_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findDraculaChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Dracula_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XXVII"

		index := romanToInt(label)

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

// formatDraculaChapterTitle creates the on-chain chapterTitle from the file label for Dracula.
// e.g. "I" -> "Chapter I", "XXVII" -> "Chapter XXVII"
func formatDraculaChapterTitle(label string) string {
	return "Chapter " + label
}

// findMobyDickChapters finds all MobyDick_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findMobyDickChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^MobyDick_Chapter_(\d+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "1", "2", ..., "135"

		index := 0
		fmt.Sscanf(label, "%d", &index)

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

// formatMobyDickChapterTitle creates the on-chain chapterTitle from the file label for Moby Dick.
// e.g. "1" -> "Chapter 1", "135" -> "Chapter 135"
func formatMobyDickChapterTitle(label string) string {
	return "Chapter " + label
}

// findSherlockAdventures finds all Sherlock_Adventure_*.txt files, parses their adventure index,
// and returns them sorted by index.
func findSherlockAdventures(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Sherlock_Adventure_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XII"

		index := romanToInt(label)

		if index < minIndex {
			// Skip adventures before the requested starting point
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

// formatSherlockAdventureTitle creates the on-chain chapterTitle from the file label for Sherlock.
// e.g. "I" -> "Adventure I", "XII" -> "Adventure XII"
func formatSherlockAdventureTitle(label string) string {
	return "Adventure " + label
}

func main() {

	// Config
	const (
		bookTitle   = "The Adventures of Sherlock Holmes"
		author      = "Arthur Conan Doyle"
		genre       = "Mistery"
		edition     = "Project Gutenberg eBook #1661"
		summary     = "The Adventures of Sherlock Holmes is a collection of twelve short stories by Arthur Conan Doyle, first published in 1892. It contains the earliest short stories featuring the consulting detective Sherlock Holmes, including iconic tales like A Scandal in Bohemia, The Red-Headed League, and The Adventure of the Speckled Band."
		startIndex  = 1       // Start from Adventure I (1)
		booksFolder = "books" // Relative to repo root when running `go run ./tasks/main.go`
		signer      = "Prime-librarian"
	)

	// Set up Overflow
	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	color.Red("Alexandria Contract - The Adventures of Sherlock Holmes Upload")
	color.Red("")

	// Check if book already exists by trying to get it
	// If it doesn't exist, the script will panic/error, which we'll catch
	color.Cyan("Checking if book already exists...")
	bookExists := false
	bookResult := o.Script("get_book", WithArg("bookTitle", bookTitle))
	
	// Check if the script executed successfully (book exists)
	// If the book doesn't exist, the contract's pre-condition will cause an error
	if bookResult != nil {
		err := bookResult.Err
		if err == nil {
			bookExists = true
		}
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
		
		// Check if the transaction failed because book already exists
		if result.Err != nil && strings.Contains(result.Err.Error(), "already in the Library") {
			color.Green("Book already exists (detected during creation). Skipping.")
		} else {
			result.Print()
			color.Green("Book created successfully!")
		}
	} else {
		color.Green("Book already exists. Skipping book creation.")
	}

	// Discover all Sherlock adventure files from I onward
	chapterFiles, err := findSherlockAdventures(booksFolder, startIndex)
	if err != nil {
		fmt.Printf("Error discovering Sherlock adventure files: %v\n", err)
		os.Exit(1)
	}

	if len(chapterFiles) == 0 {
		fmt.Println("No Sherlock_Adventure_*.txt files found from Adventure I onward")
		return
	}

	fmt.Printf("\nFound %d Sherlock adventure files from Adventure I onward:\n", len(chapterFiles))
	for _, ch := range chapterFiles {
		fmt.Printf("  - %s (index %d, label %s)\n", ch.Path, ch.Index, ch.Label)
	}

	// Loop over all adventures from I to the last and upload them
	for _, ch := range chapterFiles {
		chapterTitle := formatSherlockAdventureTitle(ch.Label)

		color.Cyan("\nProcessing %s (index %d)", chapterTitle, ch.Index)

		paragraphs, err := ReadFile(ch.Path)
		if err != nil {
			fmt.Printf("Error reading %s: %v\n", ch.Path, err)
			os.Exit(1)
		}

		fmt.Printf("Successfully loaded %d paragraphs from %s\n", len(paragraphs), ch.Path)

		// Add adventure title (name) if needed
		color.Yellow("Adding adventure name on-chain: %s", chapterTitle)
		o.Tx("Admin/add_chapter_name",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", chapterTitle),
		).Print()

		// Add the full adventure content
		color.Yellow("Adding adventure content on-chain: %s (index %d)", chapterTitle, ch.Index)
		o.Tx("Admin/add_chapter",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", chapterTitle),
			WithArg("index", ch.Index),
			WithArg("paragraphs", paragraphs),
		).Print()
	}

	color.Green("\nFinished uploading The Adventures of Sherlock Holmes from Adventure I to Adventure XII.")
}

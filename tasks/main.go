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

// frankensteinSection holds info about a Frankenstein section (Letter or Chapter)
type frankensteinSection struct {
	Path      string
	Type      string // "Letter" or "Chapter"
	Number    string // "1", "2", etc.
	SortIndex int    // For sorting: Letters 1-4 = 1-4, Chapters 1-24 = 5-28
}

// findFrankensteinSections finds all Frankenstein_Letter_*.txt and Frankenstein_Chapter_*.txt files,
// and returns them sorted (Letters first, then Chapters).
func findFrankensteinSections(baseDir string) ([]frankensteinSection, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	letterRe := regexp.MustCompile(`^Frankenstein_Letter_(\d+)\.txt$`)
	chapterRe := regexp.MustCompile(`^Frankenstein_Chapter_(\d+)\.txt$`)

	var sections []frankensteinSection
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		
		if m := letterRe.FindStringSubmatch(e.Name()); len(m) == 2 {
			num := 0
			fmt.Sscanf(m[1], "%d", &num)
			sections = append(sections, frankensteinSection{
				Path:      filepath.Join(baseDir, e.Name()),
				Type:      "Letter",
				Number:    m[1],
				SortIndex: num, // Letters 1-4
			})
		} else if m := chapterRe.FindStringSubmatch(e.Name()); len(m) == 2 {
			num := 0
			fmt.Sscanf(m[1], "%d", &num)
			sections = append(sections, frankensteinSection{
				Path:      filepath.Join(baseDir, e.Name()),
				Type:      "Chapter",
				Number:    m[1],
				SortIndex: 100 + num, // Chapters come after Letters
			})
		}
	}

	// Sort by SortIndex (Letters first, then Chapters)
	sort.Slice(sections, func(i, j int) bool {
		return sections[i].SortIndex < sections[j].SortIndex
	})

	return sections, nil
}

// formatFrankensteinSectionTitle creates the on-chain chapterTitle from the section.
// e.g. "Letter 1", "Chapter 24"
func formatFrankensteinSectionTitle(secType, secNum string) string {
	return secType + " " + secNum
}

// findCountChapters finds all Count_V1_Chapter_*.txt files (Volume One), parses their chapter index,
// and returns them sorted by index.
func findCountChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Count_V1_Chapter_(\d+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "1", "2", ..., "36"

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

// formatCountChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "1" -> "Volume One - Chapter 1", "36" -> "Volume One - Chapter 36"
func formatCountChapterTitle(label string) string {
	return "Volume One - Chapter " + label
}

// findAwakeningChapters finds all Awakening_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findAwakeningChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Awakening_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XXXIX"

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

// formatAwakeningChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Chapter I", "XXXIX" -> "Chapter XXXIX"
func formatAwakeningChapterTitle(label string) string {
	return "Chapter " + label
}

// findAliceChapters finds all Alice_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findAliceChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Alice_Chapter_([IVXLCDM]+)\.txt$`)

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

// formatAliceChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Chapter I", "XII" -> "Chapter XII"
func formatAliceChapterTitle(label string) string {
	return "Chapter " + label
}

// findUncleTomChapters finds all UncleTom_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findUncleTomChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^UncleTom_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XLV"

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

// formatUncleTomChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Chapter I", "XLV" -> "Chapter XLV"
func formatUncleTomChapterTitle(label string) string {
	return "Chapter " + label
}

// findScarletChapters finds all Scarlet_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findScarletChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Scarlet_Chapter_([IVXLCDM]+)\.txt$`)

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

// formatScarletChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Chapter I", "XXIV" -> "Chapter XXIV"
func formatScarletChapterTitle(label string) string {
	return "Chapter " + label
}

// findFarewellChapters finds all Farewell_Chapter_*.txt files, parses their chapter index,
// and returns them sorted by index.
func findFarewellChapters(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^Farewell_Chapter_([IVXLCDM]+)\.txt$`)

	var chapters []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "XLI"

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

// formatFarewellChapterTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Chapter I", "XLI" -> "Chapter XLI"
func formatFarewellChapterTitle(label string) string {
	return "Chapter " + label
}

// findHistoryLessons finds all History_Lesson_*.txt files, parses their lesson index,
// and returns them sorted by index.
func findHistoryLessons(baseDir string, minIndex int) ([]chapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}

	re := regexp.MustCompile(`^History_Lesson_([IVXLCDM]+)\.txt$`)

	var lessons []chapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		label := m[1] // e.g. "I", "II", ..., "LX"

		index := romanToInt(label)

		if index < minIndex {
			// Skip lessons before the requested starting point
			continue
		}

		lessons = append(lessons, chapterFile{
			Path:  filepath.Join(baseDir, e.Name()),
			Label: label,
			Index: index,
		})
	}

	// Sort by numeric index
	sort.Slice(lessons, func(i, j int) bool {
		return lessons[i].Index < lessons[j].Index
	})

	return lessons, nil
}

// formatHistoryLessonTitle creates the on-chain chapterTitle from the file label.
// e.g. "I" -> "Lesson I", "LX" -> "Lesson LX"
func formatHistoryLessonTitle(label string) string {
	return "Lesson " + label
}

func main() {

	// Config
	const (
		bookTitle   = "A Complete History of Music"
		author      = "W. J. Baltzell"
		genre       = "History"
		edition     = "Project Gutenberg eBook #54392"
		summary     = "A Complete History of Music for Schools, Clubs, and Private Reading by W. J. Baltzell, with contributions by H. A. Clarke, Arthur Elson, and others. This comprehensive work traces the development of music from ancient times through the early 20th century, covering various musical periods, composers, and the evolution of musical forms and instruments."
		startIndex  = 1       // Start from Lesson I (1)
		booksFolder = "books" // Relative to repo root when running `go run ./tasks/main.go`
		signer      = "Prime-librarian"
	)

	// Set up Overflow
	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	color.Red("Alexandria Contract - A Complete History of Music Upload")
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

	// Discover all History lesson files from I onward
	lessonFiles, err := findHistoryLessons(booksFolder, startIndex)
	if err != nil {
		fmt.Printf("Error discovering History lesson files: %v\n", err)
		os.Exit(1)
	}

	if len(lessonFiles) == 0 {
		fmt.Println("No History_Lesson_*.txt files found from Lesson I onward")
		return
	}

	fmt.Printf("\nFound %d A Complete History of Music lesson files from Lesson I onward:\n", len(lessonFiles))
	for _, lesson := range lessonFiles {
		fmt.Printf("  - %s (index %d, label %s)\n", lesson.Path, lesson.Index, lesson.Label)
	}

	// Loop over all lessons from I to the last and upload them
	for _, lesson := range lessonFiles {
		lessonTitle := formatHistoryLessonTitle(lesson.Label)

		color.Cyan("\nProcessing %s (index %d)", lessonTitle, lesson.Index)

		paragraphs, err := ReadFile(lesson.Path)
		if err != nil {
			fmt.Printf("Error reading %s: %v\n", lesson.Path, err)
			os.Exit(1)
		}

		fmt.Printf("Successfully loaded %d paragraphs from %s\n", len(paragraphs), lesson.Path)

		// Add lesson title (name) if needed
		color.Yellow("Adding lesson name on-chain: %s", lessonTitle)
		o.Tx("Admin/add_chapter_name",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", lessonTitle),
		).Print()

		// Add the full lesson content
		color.Yellow("Adding lesson content on-chain: %s (index %d)", lessonTitle, lesson.Index)
		o.Tx("Admin/add_chapter",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", lessonTitle),
			WithArg("index", lesson.Index),
			WithArg("paragraphs", paragraphs),
		).Print()
	}

	color.Green("\nFinished uploading A Complete History of Music lessons from Lesson I to Lesson LX.")
}

package gutenberg

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"
)

// EscapeForCadence escapes a string for Cadence string literals.
// Raw newlines, tabs, and other C0 controls break Cadence parsing if passed through literally.
func EscapeForCadence(s string) string {
	var b strings.Builder
	for _, r := range s {
		switch r {
		case '\\':
			b.WriteString(`\\`)
		case '"':
			b.WriteString(`\"`)
		case '\n':
			b.WriteString(`\n`)
		case '\r':
			b.WriteString(`\r`)
		case '\t':
			b.WriteString(`\t`)
		default:
			if r < 32 {
				b.WriteRune(' ')
			} else {
				b.WriteRune(r)
			}
		}
	}
	return b.String()
}

// ReadParagraphsFile reads a text file and returns non-empty lines as Cadence-escaped paragraphs.
func ReadParagraphsFile(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var content string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		content += scanner.Text() + "\n"
	}
	if err := scanner.Err(); err != nil {
		return nil, err
	}

	rawParagraphs := strings.Split(content, "\n")
	paragraphs := make([]string, 0, len(rawParagraphs))
	for _, paragraph := range rawParagraphs {
		trimmed := strings.TrimSpace(paragraph)
		if trimmed != "" {
			paragraphs = append(paragraphs, EscapeForCadence(trimmed))
		}
	}
	return paragraphs, nil
}

// ChapterFile is one section file on disk.
type ChapterFile struct {
	Path  string
	Label string
	Index int
}

// FindSections finds section files matching sectionFileRegex (one submatch for index).
func FindSections(baseDir, sectionFileRegex string, minIndex int) ([]ChapterFile, error) {
	entries, err := os.ReadDir(baseDir)
	if err != nil {
		return nil, err
	}
	re := regexp.MustCompile(sectionFileRegex)
	var sections []ChapterFile
	for _, e := range entries {
		if e.IsDir() {
			continue
		}
		m := re.FindStringSubmatch(e.Name())
		if len(m) != 2 {
			continue
		}
		var index int
		if _, err := fmt.Sscanf(m[1], "%d", &index); err != nil {
			continue
		}
		if index < minIndex {
			continue
		}
		sections = append(sections, ChapterFile{
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

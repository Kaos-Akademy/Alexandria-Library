package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// romanToInt converts a Roman numeral to an integer
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

func main() {
	// Path to the full book text
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/awakening.txt"

	file, err := os.Open(inputPath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}

	// Chapter headings are just Roman numerals on their own line:
	// I, II, III, ..., XXXIX
	// Skip the TOC and start after "THE AWAKENING" header (around line 103)
	// Stop at XXXIX (chapter 39) to avoid short stories that come after
	chapterRegex := regexp.MustCompile(`^\s*([IVXLCDM]+)\s*$`)
	var chapterStarts []int
	var chapterLabels []string

	startSearchLine := 100 // Skip TOC, start after "THE AWAKENING" header
	maxChapter := 39       // The Awakening has 39 chapters (I-XXXIX)

	for i := startSearchLine; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if chapterRegex.MatchString(trimmed) {
			match := chapterRegex.FindStringSubmatch(trimmed)
			label := match[1]
			chapterNum := romanToInt(label)
			
			// Only include chapters 1-39 (The Awakening)
			if chapterNum <= maxChapter {
				chapterStarts = append(chapterStarts, i)
				chapterLabels = append(chapterLabels, label)
			}
			
			// Stop after finding chapter XXXIX
			if chapterNum == maxChapter {
				break
			}
		}
	}

	if len(chapterStarts) == 0 {
		panic("no chapter headings found")
	}

	fmt.Printf("Found %d chapters in The Awakening\n", len(chapterStarts))
	for i, start := range chapterStarts {
		fmt.Printf("Chapter %s starts at line %d\n", chapterLabels[i], start+1)
	}

	// Create chapter files
	for i, start := range chapterStarts {
		var end int
		if i+1 < len(chapterStarts) {
			end = chapterStarts[i+1]
		} else {
			// Last chapter - find where short stories begin (around line 5750)
			// or end of file
			end = 5750
			if end > len(lines) {
				end = len(lines)
			}
		}

		chLabel := chapterLabels[i]
		chIndex := romanToInt(chLabel)

		// Output path: one txt file per chapter
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Awakening_Chapter_%s.txt", chLabel)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// Chapter I must contain everything before it as well (introduction, etc.)
		startLine := start
		if chIndex == 1 {
			startLine = 0
		}

		var processedLines []string
		var currentParagraph strings.Builder

		for j := startLine; j < end; j++ {
			line := lines[j]
			trimmed := strings.TrimSpace(line)

			// Paragraph break on empty line
			if trimmed == "" {
				if currentParagraph.Len() > 0 {
					processedLines = append(processedLines, currentParagraph.String())
					currentParagraph.Reset()
				}
				// Keep a blank line as a separator
				processedLines = append(processedLines, "")
				continue
			}

			// First line of a new paragraph
			if currentParagraph.Len() == 0 {
				currentParagraph.WriteString(trimmed)
			} else {
				// Continue same paragraph with a space
				currentParagraph.WriteString(" " + trimmed)
			}
		}

		// Flush last paragraph, if any
		if currentParagraph.Len() > 0 {
			processedLines = append(processedLines, currentParagraph.String())
		}

		// Write each paragraph / separator as one line in the txt file
		for _, pl := range processedLines {
			_, err := outFile.WriteString(pl + "\n")
			if err != nil {
				outFile.Close()
				panic(err)
			}
		}
		outFile.Close()

		fmt.Printf("Created Awakening_Chapter_%s.txt (index %d, %d source lines, %d paragraph lines)\n",
			chLabel, chIndex, end-startLine, len(processedLines))
	}

	fmt.Println("All Awakening chapter files have been created as plain txt with one paragraph per line.")
}

package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strconv"
	"strings"
)

func main() {
	// Path to the full book text
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Moby dick.txt"

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

	// Chapter headings look like:
	// CHAPTER 1. Loomings.
	// CHAPTER 2. The Carpet-Bag.
	// ...
	// CHAPTER 135. The Chase.—Third Day.
	// Note: There's a table of contents at the beginning that also has "CHAPTER" lines,
	// so we skip until after line 800 where the actual chapters start
	chapterRegex := regexp.MustCompile(`^\s*CHAPTER\s+(\d+)\.\s+.+$`)
	var chapterStarts []int
	var chapterLabels []string

	// Skip the table of contents - actual chapters start around line 841
	startSearchLine := 800

	for i := startSearchLine; i < len(lines); i++ {
		line := lines[i]
		if chapterRegex.MatchString(strings.TrimSpace(line)) {
			match := chapterRegex.FindStringSubmatch(strings.TrimSpace(line))
			chapterStarts = append(chapterStarts, i)
			chapterLabels = append(chapterLabels, match[1])
		}
	}

	if len(chapterStarts) == 0 {
		panic("no chapter headings found")
	}

	fmt.Printf("Found %d chapters in Moby Dick text\n", len(chapterStarts))
	for i, start := range chapterStarts {
		fmt.Printf("Chapter %s starts at line %d\n", chapterLabels[i], start+1)
	}

	// Create chapter files
	for i, start := range chapterStarts {
		var end int
		if i+1 < len(chapterStarts) {
			end = chapterStarts[i+1]
		} else {
			end = len(lines)
		}

		chLabel := chapterLabels[i]

		// Output path: one txt file per chapter
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/MobyDick_Chapter_%s.txt", chLabel)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// Chapter 1 must contain everything before it as well (including Etymology, Extracts, etc.)
		startLine := start
		chNum, _ := strconv.Atoi(chLabel)
		if chNum == 1 {
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
				// Keep a blank line as a separator (optional)
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

		fmt.Printf("Created MobyDick_Chapter_%s.txt (%d source lines, %d paragraph lines)\n",
			chLabel, end-startLine, len(processedLines))
	}

	fmt.Println("All Moby Dick chapter files have been created as plain txt with one paragraph per line.")
}

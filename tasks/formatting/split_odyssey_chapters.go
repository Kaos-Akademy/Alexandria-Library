package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

func main() {
	// Path to the full book text
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/The Odyssey.tx"

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
	// BOOK I
	// BOOK II
	// ...
	// BOOK XXIV
	chapterRegex := regexp.MustCompile(`^\s*BOOK\s+([IVXLCDM]+)\s*$`)
	var chapterStarts []int
	var chapterLabels []string

	for i, line := range lines {
		if chapterRegex.MatchString(strings.TrimSpace(line)) {
			chapterStarts = append(chapterStarts, i)
			match := chapterRegex.FindStringSubmatch(strings.TrimSpace(line))
			chapterLabels = append(chapterLabels, match[1])
		}
	}

	if len(chapterStarts) == 0 {
		panic("no chapter headings found")
	}

	fmt.Printf("Found %d chapters in The Odyssey text\n", len(chapterStarts))
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
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Odyssey_Chapter_%s.txt", chLabel)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// BOOK I must contain everything before it as well
		startLine := start
		if chLabel == "I" {
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

		fmt.Printf("Created Odyssey_Chapter_%s.txt (%d source lines, %d paragraph lines)\n",
			chLabel, end-startLine, len(processedLines))
	}

	fmt.Println("All Odyssey chapter files have been created as plain txt with one paragraph per line.")
}


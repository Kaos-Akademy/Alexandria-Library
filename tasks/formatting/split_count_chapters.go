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
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/count.txt"

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
	// Chapter 1. Marseilles—The Arrival
	// Chapter 2. Father and Son
	// ...
	// Chapter 117. The Fifth of October
	// Pattern: "Chapter N. Title" - note there's a space before "Chapter" in actual chapters
	// Skip the TOC - actual chapters start around line 169
	chapterRegex := regexp.MustCompile(`^\s*Chapter\s+(\d+)\.\s+.+$`)
	var chapterStarts []int
	var chapterNumbers []string

	startSearchLine := 168 // Skip TOC

	for i := startSearchLine; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if chapterRegex.MatchString(trimmed) {
			match := chapterRegex.FindStringSubmatch(trimmed)
			chapterStarts = append(chapterStarts, i)
			chapterNumbers = append(chapterNumbers, match[1])
		}
	}

	if len(chapterStarts) == 0 {
		panic("no chapter headings found")
	}

	fmt.Printf("Found %d chapters in The Count of Monte Cristo\n", len(chapterStarts))
	for i, start := range chapterStarts {
		fmt.Printf("Chapter %s starts at line %d\n", chapterNumbers[i], start+1)
	}

	// Create chapter files
	for i, start := range chapterStarts {
		var end int
		if i+1 < len(chapterStarts) {
			end = chapterStarts[i+1]
		} else {
			end = len(lines)
		}

		chNum := chapterNumbers[i]

		// Output path: one txt file per chapter (Volume One)
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Count_V1_Chapter_%s.txt", chNum)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// Chapter 1 must contain everything before it as well (introduction, etc.)
		startLine := start
		chNumInt, _ := strconv.Atoi(chNum)
		if chNumInt == 1 {
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

		fmt.Printf("Created Count_V1_Chapter_%s.txt (index %d, %d source lines, %d paragraph lines)\n",
			chNum, chNumInt, end-startLine, len(processedLines))
	}

	fmt.Println("All Count of Monte Cristo Volume One chapter files have been created as plain txt with one paragraph per line.")
}

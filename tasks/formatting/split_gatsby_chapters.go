package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

func main() {
	// Read the full book
	file, err := os.Open("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Gatsby.txt")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Find chapter boundaries - looking for "Chapter I", "Chapter II", etc.
	chapterRegex := regexp.MustCompile(`^\s*Chapter ([IVX]+)\s*$`)
	var chapterStarts []int
	var chapterNumbers []string

	for i, line := range lines {
		if chapterRegex.MatchString(strings.TrimSpace(line)) {
			chapterStarts = append(chapterStarts, i)
			match := chapterRegex.FindStringSubmatch(strings.TrimSpace(line))
			chapterNumbers = append(chapterNumbers, match[1])
		}
	}

	fmt.Printf("Found %d chapters\n", len(chapterStarts))
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

		chapterNum := chapterNumbers[i]
		filename := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Gatsby_Chapter_%s.txt", chapterNum)

		chapterFile, err := os.Create(filename)
		if err != nil {
			panic(err)
		}

		// For Chapter I, include all content from the beginning
		var startLine int
		if chapterNum == "I" {
			startLine = 0
		} else {
			startLine = start
		}

		// Process lines: combine paragraphs and fix quotes
		var processedLines []string
		var currentParagraph strings.Builder

		for j := startLine; j < end; j++ {
			line := lines[j]
			trimmed := strings.TrimSpace(line)

			// If line is empty, it's a paragraph break
			if trimmed == "" {
				if currentParagraph.Len() > 0 {
					// Fix quotes in the paragraph before adding
					paraText := currentParagraph.String()
					paraText = strings.ReplaceAll(paraText, `"`, `"`)
					paraText = strings.ReplaceAll(paraText, `"`, `"`)
					paraText = strings.ReplaceAll(paraText, `'`, `'`)
					processedLines = append(processedLines, paraText)
					currentParagraph.Reset()
				}
				processedLines = append(processedLines, "")
				continue
			}

			// If this is the first line of a paragraph
			if currentParagraph.Len() == 0 {
				currentParagraph.WriteString(trimmed)
			} else {
				// Add a space and continue the paragraph
				currentParagraph.WriteString(" " + trimmed)
			}
		}

		// Don't forget the last paragraph
		if currentParagraph.Len() > 0 {
			paraText := currentParagraph.String()
			paraText = strings.ReplaceAll(paraText, `"`, `"`)
			paraText = strings.ReplaceAll(paraText, `"`, `"`)
			paraText = strings.ReplaceAll(paraText, `'`, `'`)
			processedLines = append(processedLines, paraText)
		}

		// Write processed content to file
		for _, line := range processedLines {
			chapterFile.WriteString(line + "\n")
		}
		chapterFile.Close()

		fmt.Printf("Created Chapter %s (%d lines, %d processed lines)\n", chapterNum, end-startLine, len(processedLines))
	}

	fmt.Println("All Gatsby chapter files have been created!")
}

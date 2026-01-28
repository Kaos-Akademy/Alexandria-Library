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
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/frankenstein.txt"

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

	// Section headings look like:
	// Letter 1, Letter 2, Letter 3, Letter 4
	// Chapter 1, Chapter 2, ..., Chapter 24
	// Pattern: "Letter N" or "Chapter N" on its own line
	// Note: Skip the table of contents - actual sections start around line 68
	sectionRegex := regexp.MustCompile(`^\s*(Letter|Chapter)\s+(\d+)\s*$`)
	var sectionStarts []int
	var sectionTypes []string  // "Letter" or "Chapter"
	var sectionNumbers []string

	startSearchLine := 65 // Skip TOC

	for i := startSearchLine; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		if sectionRegex.MatchString(trimmed) {
			match := sectionRegex.FindStringSubmatch(trimmed)
			sectionStarts = append(sectionStarts, i)
			sectionTypes = append(sectionTypes, match[1])
			sectionNumbers = append(sectionNumbers, match[2])
		}
	}

	if len(sectionStarts) == 0 {
		panic("no section headings found")
	}

	fmt.Printf("Found %d sections in Frankenstein\n", len(sectionStarts))
	for i, start := range sectionStarts {
		fmt.Printf("%s %s starts at line %d\n", sectionTypes[i], sectionNumbers[i], start+1)
	}

	// Create section files
	for i, start := range sectionStarts {
		var end int
		if i+1 < len(sectionStarts) {
			end = sectionStarts[i+1]
		} else {
			end = len(lines)
		}

		secType := sectionTypes[i]
		secNum := sectionNumbers[i]

		// Output path: one txt file per section
		// e.g., Frankenstein_Letter_1.txt or Frankenstein_Chapter_1.txt
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Frankenstein_%s_%s.txt", secType, secNum)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// Letter 1 must contain everything before it as well (introduction, etc.)
		startLine := start
		if secType == "Letter" && secNum == "1" {
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

		secIndex, _ := strconv.Atoi(secNum)
		fmt.Printf("Created Frankenstein_%s_%s.txt (index %d, %d source lines, %d paragraph lines)\n",
			secType, secNum, secIndex, end-startLine, len(processedLines))
	}

	fmt.Println("All Frankenstein section files have been created as plain txt with one paragraph per line.")
}

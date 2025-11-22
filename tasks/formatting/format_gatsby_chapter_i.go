package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	filename := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Gatsby_Chapter_I.txt"
	
	// Read the file
	file, err := os.Open(filename)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Find where the metadata ends (after "Faded Page eBook #20181181")
	metadataEnd := -1
	for i, line := range lines {
		if strings.Contains(line, "Faded Page eBook") {
			metadataEnd = i
			break
		}
	}

	if metadataEnd == -1 {
		panic("Could not find metadata end marker")
	}

	// Keep metadata lines as-is (lines 0 to metadataEnd)
	var processedLines []string
	for i := 0; i <= metadataEnd; i++ {
		processedLines = append(processedLines, lines[i])
	}

	// Process the rest: combine paragraphs into single lines
	var currentParagraph strings.Builder
	
	for i := metadataEnd + 1; i < len(lines); i++ {
		line := lines[i]
		trimmed := strings.TrimSpace(line)
		
		// If line is empty, it's a paragraph break
		if trimmed == "" {
			if currentParagraph.Len() > 0 {
				processedLines = append(processedLines, currentParagraph.String())
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
		processedLines = append(processedLines, currentParagraph.String())
	}

	// Write the processed content back to the file
	outputFile, err := os.Create(filename)
	if err != nil {
		panic(err)
	}
	defer outputFile.Close()
	
	for _, line := range processedLines {
		outputFile.WriteString(line + "\n")
	}
	
	fmt.Printf("Successfully formatted Gatsby Chapter I\n")
	fmt.Printf("Metadata preserved (lines 1-%d)\n", metadataEnd+1)
	fmt.Printf("Total processed lines: %d\n", len(processedLines))
}

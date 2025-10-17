package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	inputFile := "../../books/1984_PART_TWO.txt"
	outputDir := "../../books"

	// Open the input file
	file, err := os.Open(inputFile)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	var currentChapter string
	var currentContent strings.Builder
	chapterCount := 0
	skipLines := true // Skip until we find first chapter

	// Process the file line by line
	for scanner.Scan() {
		line := scanner.Text()

		// Check if this is a new chapter (but not the appendix chapters)
		if strings.HasPrefix(line, "Chapter") && !strings.Contains(line, "Ignorance is Strength") && !strings.Contains(line, "War is Peace") {
			// If we have content from a previous chapter, save it
			if currentChapter != "" {
				saveContent(outputDir, currentChapter, currentContent.String())
				currentContent.Reset()
			}
			chapterCount++
			currentChapter = fmt.Sprintf("Chapter_%d", chapterCount)
			skipLines = false
		}

		// Add the line to current content if we're not skipping
		if !skipLines {
			currentContent.WriteString(line + "\n")
		}
	}

	// Save the last chapter
	if currentChapter != "" {
		saveContent(outputDir, currentChapter, currentContent.String())
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading file: %v\n", err)
	}
}

func saveContent(outputDir, chapter, content string) {
	filename := filepath.Join(outputDir, fmt.Sprintf("1984_PART_TWO_%s.txt", chapter))
	err := os.WriteFile(filename, []byte(content), 0644)
	if err != nil {
		fmt.Printf("Error writing file %s: %v\n", filename, err)
	} else {
		fmt.Printf("Successfully created %s\n", filename)
	}
}

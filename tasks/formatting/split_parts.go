package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	inputFile := "../../books/1984_formatted.txt"
	outputDir := "../../books"

	// Open the input file
	file, err := os.Open(inputFile)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)

	var currentPart string
	var currentContent strings.Builder

	// Process the file line by line
	for scanner.Scan() {
		line := scanner.Text()

		// Check if this is a new part
		if strings.HasPrefix(line, "PART") {
			// If we have content from a previous part, save it
			if currentPart != "" {
				saveContent(outputDir, currentPart, currentContent.String())
				currentContent.Reset()
			}
			currentPart = strings.ReplaceAll(line, " ", "_")
		}

		// Add the line to current content
		currentContent.WriteString(line + "\n")
	}

	// Save the last part
	if currentPart != "" {
		saveContent(outputDir, currentPart, currentContent.String())
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading file: %v\n", err)
	}
}

func saveContent(outputDir, part, content string) {
	filename := filepath.Join(outputDir, fmt.Sprintf("1984_%s.txt", part))
	err := os.WriteFile(filename, []byte(content), 0644)
	if err != nil {
		fmt.Printf("Error writing file %s: %v\n", filename, err)
	} else {
		fmt.Printf("Successfully created %s\n", filename)
	}
}

package main

import (
	"bufio"
	"fmt"
	"os"
	"strings"
)

func main() {
	// Get all chapter files
	chapterFiles := []string{
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_I.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_II.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_III.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_IV.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_V.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_VI.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_VII.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_VIII.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_IX.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_X.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XI.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XII.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XIII.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XIV.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XV.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XVI.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XVII.txt",
		"/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_XVIII.txt",
	}

	for _, filename := range chapterFiles {
		fmt.Printf("Processing %s...\n", filename)

		// Read the file
		file, err := os.Open(filename)
		if err != nil {
			fmt.Printf("Error opening %s: %v\n", filename, err)
			continue
		}

		scanner := bufio.NewScanner(file)
		var lines []string
		for scanner.Scan() {
			lines = append(lines, scanner.Text())
		}
		file.Close()

		// Process the lines to combine paragraphs
		var processedLines []string
		var currentParagraph strings.Builder

		for _, line := range lines {
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
			fmt.Printf("Error creating %s: %v\n", filename, err)
			continue
		}

		for _, line := range processedLines {
			outputFile.WriteString(line + "\n")
		}
		outputFile.Close()

		fmt.Printf("Fixed formatting for %s\n", filename)
	}

	fmt.Println("All chapter files have been reformatted!")
}

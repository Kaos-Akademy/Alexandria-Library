package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func main() {
	inputFile := "books/republic.txt"
	outputDir := "books"

	file, err := os.Open(inputFile)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	// Match "BOOK I.", "BOOK II.", ... "BOOK X." in body; skip contents (first ~400 lines).
	bookPattern := regexp.MustCompile(`^\s*BOOK [IVX]+\.`)

	var bookStarts []int
	for i, line := range lines {
		if i < 400 {
			continue
		}
		trimmed := strings.TrimSpace(line)
		if bookPattern.MatchString(trimmed) {
			bookStarts = append(bookStarts, i)
		}
	}

	if len(bookStarts) == 0 {
		fmt.Println("No BOOK markers found in republic.txt")
		return
	}

	sectionCount := len(bookStarts)
	fmt.Printf("Found %d books (lines %v)\n", sectionCount, bookStarts)

	// Section 1 = front matter + Book I.
	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	if sectionCount > 1 {
		sectionEnds[0] = bookStarts[1] - 1
	} else {
		sectionEnds[0] = len(lines) - 1
	}

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = bookStarts[i]
		if i+1 < sectionCount {
			sectionEnds[i] = bookStarts[i+1] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("Republic_Section_%d.txt", i+1)
		outputPath := filepath.Join(outputDir, filename)

		outFile, err := os.Create(outputPath)
		if err != nil {
			fmt.Printf("Error creating file %s: %v\n", outputPath, err)
			continue
		}
		writer := bufio.NewWriter(outFile)
		for j := start; j <= end && j < len(lines); j++ {
			writer.WriteString(lines[j] + "\n")
		}
		writer.Flush()
		outFile.Close()
		fmt.Printf("Created: %s (Section %d, lines %d-%d)\n", filename, i+1, start+1, end+1)
	}
	fmt.Println("Done!")
}


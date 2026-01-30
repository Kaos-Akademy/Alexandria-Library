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
	inputFile := "books/crime.txt"
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

	// Match standalone chapter headers: "CHAPTER I", "CHAPTER II", etc. (skip PART I, PART II)
	chapterPattern := regexp.MustCompile(`^CHAPTER [IVXLCDM]+$`)

	var chapterStarts []int
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if chapterPattern.MatchString(trimmed) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) == 0 {
		fmt.Println("No chapter markers found in crime.txt")
		return
	}

	fmt.Printf("Found %d chapters (lines %v)\n", len(chapterStarts), chapterStarts)

	for i, start := range chapterStarts {
		var end int
		if i+1 < len(chapterStarts) {
			end = chapterStarts[i+1] - 1
		} else {
			end = len(lines) - 1
		}

		filename := fmt.Sprintf("Crime_Section_%d.txt", i+1)
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
		fmt.Printf("Created: %s (Chapter %d, lines %d-%d)\n", filename, i+1, start+1, end+1)
	}
	fmt.Println("Done!")
}

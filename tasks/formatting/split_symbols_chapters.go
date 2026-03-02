package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

func main() {
	inputFile := "books/symbols.txt"
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

	// Match standalone "Part I.", "Part II.", "Part III." (contents have "Part I. The Parable." etc., so only body headers match).
	chapterPattern := regexp.MustCompile(`^\s+Part (I|II|III)\.\s*$`)

	var chapterStarts []int
	for i, line := range lines {
		if chapterPattern.MatchString(line) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 3 {
		fmt.Printf("Expected 3 part markers, found %d: %v\n", len(chapterStarts), chapterStarts)
		return
	}

	sectionCount := 3
	fmt.Printf("Found %d parts (lines %v)\n", sectionCount, chapterStarts)

	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	sectionEnds[0] = chapterStarts[1] - 1

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = chapterStarts[i]
		if i+1 < sectionCount {
			sectionEnds[i] = chapterStarts[i+1] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("Symbols_Section_%d.txt", i+1)
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

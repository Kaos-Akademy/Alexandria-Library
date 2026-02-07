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
	inputFile := "books/jung.txt"
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

	// Standalone Roman numeral with period (I., II., ... VIII.). Trim so TOC lines like "   I. The Psychology..." don't match.
	chapterPattern := regexp.MustCompile(`^[IVXLCDM]+\.$`)
	var chapterStarts []int
	for i, line := range lines {
		if chapterPattern.MatchString(strings.TrimSpace(line)) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 8 {
		fmt.Printf("Expected 8 chapters, found %d\n", len(chapterStarts))
		return
	}

	// Section 1 = from start of file (intro + CONTENTS + first chapter) through end of Chapter I.
	sectionStarts := make([]int, 8)
	sectionEnds := make([]int, 8)
	sectionStarts[0] = 0
	sectionEnds[0] = chapterStarts[1] - 1
	for i := 1; i < 7; i++ {
		sectionStarts[i] = chapterStarts[i]
		sectionEnds[i] = chapterStarts[i+1] - 1
	}
	sectionStarts[7] = chapterStarts[7]
	sectionEnds[7] = len(lines) - 1

	fmt.Printf("Found 8 chapters. Section 1 includes intro + CONTENTS + Chapter I (lines 1-%d).\n", sectionEnds[0]+1)

	for i := 0; i < 8; i++ {
		start, end := sectionStarts[i], sectionEnds[i]
		filename := fmt.Sprintf("Jung_Section_%d.txt", i+1)
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
		fmt.Printf("Created: %s (lines %d-%d)\n", filename, start+1, end+1)
	}
	fmt.Println("Done!")
}

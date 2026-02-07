package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
)

func main() {
	inputFile := "books/picture.txt"
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

	// Match standalone chapter headers: "CHAPTER I.", "CHAPTER II.", ... "CHAPTER XX."
	chapterPattern := regexp.MustCompile(`^CHAPTER [IVXLCDM]+\.$`)

	// Match raw line (no trim) so Contents lines " CHAPTER I." (leading space) are excluded
	var chapterStarts []int
	for i, line := range lines {
		if chapterPattern.MatchString(line) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 20 {
		fmt.Printf("Expected 20 chapters, found %d\n", len(chapterStarts))
		return
	}

	// Section 1 = from start of file (intro + Preface + Chapter I) through end of Chapter I.
	// Section i (i>=2) = Chapter i through end of Chapter i; Section 20 = Chapter XX to end.
	sectionStarts := make([]int, 20)
	sectionEnds := make([]int, 20)
	sectionStarts[0] = 0
	sectionEnds[0] = chapterStarts[1] - 1
	for i := 1; i < 19; i++ {
		sectionStarts[i] = chapterStarts[i]
		sectionEnds[i] = chapterStarts[i+1] - 1
	}
	sectionStarts[19] = chapterStarts[19]
	sectionEnds[19] = len(lines) - 1

	fmt.Printf("Found 20 chapters. Section 1 includes intro + Preface + Chapter I (lines 1-%d).\n", sectionEnds[0]+1)

	for i := 0; i < 20; i++ {
		start, end := sectionStarts[i], sectionEnds[i]
		filename := fmt.Sprintf("Picture_Section_%d.txt", i+1)
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

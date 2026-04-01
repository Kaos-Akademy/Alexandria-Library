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
	inputFile := "books/prince.txt"
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

	// Body chapters start at column 0: "CHAPTER I." — TOC duplicates have a leading space; do not trim.
	chapterRe := regexp.MustCompile(`^CHAPTER [IVXLCDM]+\.`)

	var chapterStarts []int
	for i, line := range lines {
		if chapterRe.MatchString(line) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 26 {
		fmt.Printf("Expected 26 CHAPTER headers, found %d (lines %v)\n", len(chapterStarts), chapterStarts)
		return
	}

	descriptionIdx := -1
	lifeIdx := -1
	endIdx := -1
	for i, line := range lines {
		t := strings.TrimSpace(line)
		// Appendix titles appear in Contents with a leading space; body uses column 0 only.
		if descriptionIdx == -1 && strings.HasPrefix(line, "DESCRIPTION OF THE METHODS") {
			descriptionIdx = i
		}
		if lifeIdx == -1 && strings.HasPrefix(line, "THE LIFE OF CASTRUCCIO") {
			lifeIdx = i
		}
		if strings.HasPrefix(t, "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}

	if descriptionIdx == -1 || lifeIdx == -1 || endIdx == -1 {
		fmt.Println("Could not find DESCRIPTION block, THE LIFE block, or Gutenberg END marker")
		return
	}

	var starts []int
	var ends []int

	// Section 1: front matter + introduction through before CHAPTER I
	starts = append(starts, 0)
	ends = append(ends, chapterStarts[0]-1)

	// Sections 2–27: CHAPTER I … CHAPTER XXVI
	for c := 0; c < 26; c++ {
		starts = append(starts, chapterStarts[c])
		if c < 25 {
			ends = append(ends, chapterStarts[c+1]-1)
		} else {
			ends = append(ends, descriptionIdx-1)
		}
	}

	// Section 28: Duke Valentino description
	starts = append(starts, descriptionIdx)
	ends = append(ends, lifeIdx-1)

	// Section 29: Life of Castruccio (exclude license after Gutenberg END)
	starts = append(starts, lifeIdx)
	ends = append(ends, endIdx-1)

	sectionCount := len(starts)
	fmt.Printf("Writing %d sections\n", sectionCount)

	for s := 0; s < sectionCount; s++ {
		start, end := starts[s], ends[s]
		filename := fmt.Sprintf("Prince_Section_%d.txt", s+1)
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

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
	inputFile := "books/palm.txt"
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

	// Chapters I–XVII: Roman numeral alone on a line (body text; not TOC).
	romanRe := regexp.MustCompile(`^(XVII|XVI|XV|XIV|XIII|XII|XI|X|IX|VIII|VII|VI|V|IV|III|II|I)$`)

	var chapterStarts []int
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if romanRe.MatchString(t) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 17 {
		fmt.Printf("Expected 17 chapter markers, found %d (lines %v)\n", len(chapterStarts), chapterStarts)
		return
	}

	indexIdx := -1
	endIdx := -1
	for i, line := range lines {
		if indexIdx == -1 && strings.TrimSpace(line) == "INDEX" {
			indexIdx = i
		}
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}

	if indexIdx == -1 || endIdx == -1 {
		fmt.Println("Could not find INDEX or Gutenberg END marker")
		return
	}

	var starts []int
	var ends []int

	starts = append(starts, 0)
	ends = append(ends, chapterStarts[0]-1)

	for c := 0; c < 17; c++ {
		starts = append(starts, chapterStarts[c])
		if c < 16 {
			ends = append(ends, chapterStarts[c+1]-1)
		} else {
			ends = append(ends, indexIdx-1)
		}
	}

	starts = append(starts, indexIdx)
	ends = append(ends, endIdx-1)

	n := len(starts)
	fmt.Printf("Writing %d sections\n", n)

	for s := 0; s < n; s++ {
		start, end := starts[s], ends[s]
		filename := fmt.Sprintf("ItchingPalm_Section_%d.txt", s+1)
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

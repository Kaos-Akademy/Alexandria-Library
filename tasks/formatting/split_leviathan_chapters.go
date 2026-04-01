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
	inputFile := "books/levi.txt"
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

	// Body: "CHAPTER I." … most use a period; CHAPTER XL uses "CHAPTER XL OF …" (no period).
	chapterRe := regexp.MustCompile(`^CHAPTER [IVXLCDM]+(\.| OF )`)

	var chapterStarts []int
	for i, line := range lines {
		if chapterRe.MatchString(line) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) != 47 {
		fmt.Printf("Expected 47 CHAPTER headers, found %d (lines %v)\n", len(chapterStarts), chapterStarts)
		return
	}

	reviewIdx := -1
	endIdx := -1
	for i, line := range lines {
		if reviewIdx == -1 && strings.HasPrefix(line, "A REVIEW, AND CONCLUSION") {
			reviewIdx = i
		}
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}

	if reviewIdx == -1 || endIdx == -1 {
		fmt.Println("Could not find A REVIEW, AND CONCLUSION or Gutenberg END marker")
		return
	}

	var starts []int
	var ends []int

	// Section 1: front matter + introduction through line before CHAPTER I
	starts = append(starts, 0)
	ends = append(ends, chapterStarts[0]-1)

	// Sections 2–48: CHAPTER I … CHAPTER XLVII
	for c := 0; c < 47; c++ {
		starts = append(starts, chapterStarts[c])
		if c < 46 {
			ends = append(ends, chapterStarts[c+1]-1)
		} else {
			ends = append(ends, reviewIdx-1)
		}
	}

	// Section 49: Review and Conclusion (exclude license after Gutenberg END)
	starts = append(starts, reviewIdx)
	ends = append(ends, endIdx-1)

	sectionCount := len(starts)
	fmt.Printf("Writing %d sections\n", sectionCount)

	for s := 0; s < sectionCount; s++ {
		start, end := starts[s], ends[s]
		filename := fmt.Sprintf("Leviathan_Section_%d.txt", s+1)
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

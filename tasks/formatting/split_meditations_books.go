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
	inputFile := "books/meditations.txt"
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

	bookRe := regexp.MustCompile(`^THE (FIRST|SECOND|THIRD|FOURTH|FIFTH|SIXTH|SEVENTH|EIGHTH|NINTH|TENTH|ELEVENTH|TWELFTH) BOOK`)

	var bookStarts []int
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if bookRe.MatchString(t) {
			bookStarts = append(bookStarts, i)
		}
	}

	if len(bookStarts) != 12 {
		fmt.Printf("Expected 12 book headers, found %d (lines %v)\n", len(bookStarts), bookStarts)
		return
	}

	// CONTENTS also lists "APPENDIX" / "GLOSSARY" with leading spaces; only use body (column 0) markers after Book XII.
	lastBook := bookStarts[11]
	appendixIdx := -1
	glossaryIdx := -1
	endIdx := -1
	for i, line := range lines {
		if i <= lastBook {
			continue
		}
		t := strings.TrimSpace(line)
		if appendixIdx == -1 && t == "APPENDIX" {
			appendixIdx = i
		}
		if glossaryIdx == -1 && t == "GLOSSARY" {
			glossaryIdx = i
		}
	}
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if strings.HasPrefix(t, "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}

	if appendixIdx == -1 || glossaryIdx == -1 || endIdx == -1 {
		fmt.Println("Could not find APPENDIX, GLOSSARY, or Gutenberg END marker")
		return
	}

	var starts []int
	var ends []int

	starts = append(starts, 0)
	ends = append(ends, bookStarts[0]-1)

	for b := 0; b < 12; b++ {
		starts = append(starts, bookStarts[b])
		if b < 11 {
			ends = append(ends, bookStarts[b+1]-1)
		} else {
			ends = append(ends, appendixIdx-1)
		}
	}

	starts = append(starts, appendixIdx)
	ends = append(ends, glossaryIdx-1)

	starts = append(starts, glossaryIdx)
	ends = append(ends, endIdx-1)

	n := len(starts)
	fmt.Printf("Writing %d sections\n", n)

	for s := 0; s < n; s++ {
		start, end := starts[s], ends[s]
		filename := fmt.Sprintf("Meditations_Section_%d.txt", s+1)
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

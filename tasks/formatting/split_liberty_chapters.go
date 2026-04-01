package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// On Liberty (Gutenberg): CONTENTS duplicates CHAPTER headings; the essay begins at "ON LIBERTY."
// Section 1 = file start through end of Mill's Chapter I; sections 2–5 align with CHAPTER II–V.
func main() {
	inputFile := "books/liberty.txt"
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

	onLiberty := -1
	for i, line := range lines {
		if strings.TrimSpace(line) == "ON LIBERTY." {
			onLiberty = i
			break
		}
	}
	if onLiberty == -1 {
		fmt.Println(`Could not find body marker "ON LIBERTY."`)
		return
	}

	chapterRe := regexp.MustCompile(`^CHAPTER [IVXLCDM]+\.$`)
	var bodyChapters []int
	for i := onLiberty + 1; i < len(lines); i++ {
		if chapterRe.MatchString(strings.TrimSpace(lines[i])) {
			bodyChapters = append(bodyChapters, i)
		}
	}
	if len(bodyChapters) != 5 {
		fmt.Printf("Expected 5 essay chapters after ON LIBERTY., found %d at indices %v\n", len(bodyChapters), bodyChapters)
		return
	}

	endIdx := -1
	for i, line := range lines {
		if strings.HasPrefix(strings.TrimSpace(line), "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}
	if endIdx == -1 {
		fmt.Println("Could not find Gutenberg END marker")
		return
	}

	starts := []int{
		0,
		bodyChapters[1], // CHAPTER II
		bodyChapters[2], // CHAPTER III
		bodyChapters[3], // CHAPTER IV
		bodyChapters[4], // CHAPTER V
	}

	n := len(starts)
	fmt.Printf("Writing %d sections\n", n)

	for s := 0; s < n; s++ {
		start := starts[s]
		var end int
		if s < n-1 {
			end = starts[s+1] - 1
		} else {
			end = endIdx - 1
		}
		if end < start {
			fmt.Printf("Invalid range section %d\n", s+1)
			return
		}

		filename := fmt.Sprintf("Liberty_Section_%d.txt", s+1)
		outputPath := filepath.Join(outputDir, filename)

		outFile, err := os.Create(outputPath)
		if err != nil {
			fmt.Printf("Error creating file %s: %v\n", outputPath, err)
			continue
		}
		w := bufio.NewWriter(outFile)
		for j := start; j <= end && j < len(lines); j++ {
			w.WriteString(lines[j] + "\n")
		}
		w.Flush()
		outFile.Close()
		fmt.Printf("Created: %s (lines %d-%d)\n", filename, start+1, end+1)
	}
	fmt.Println("Done!")
}

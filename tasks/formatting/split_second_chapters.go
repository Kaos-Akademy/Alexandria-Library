package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// second.txt: Locke uses "CHAPTER. I." … "CHAPTER. XIX." (period after CHAPTER).
// Section 1 = file start through end of Chapter I; sections 2–19 begin at CHAPTER II … XIX.
func main() {
	inputFile := "books/second.txt"
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
		lines = append(lines, strings.TrimSuffix(scanner.Text(), "\r"))
	}
	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	lockeChapter := regexp.MustCompile(`^CHAPTER\. [IVXLCDM]+\.$`)
	var chIdx []int
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if lockeChapter.MatchString(t) {
			chIdx = append(chIdx, i)
		}
	}
	if len(chIdx) != 19 {
		fmt.Printf("Expected 19 Locke chapter lines (^CHAPTER. I. … XIX.), found %d. Save books/second.txt as the John Locke PG text (CHAPTER. I. with a period after CHAPTER).\n", len(chIdx))
		return
	}

	endIdx := -1
	for i, line := range lines {
		if strings.Contains(line, "*** END OF THE PROJECT GUTENBERG EBOOK") {
			endIdx = i
			break
		}
	}
	if endIdx == -1 {
		fmt.Println("Could not find Gutenberg END marker")
		return
	}

	starts := []int{0}
	for k := 1; k < 19; k++ {
		starts = append(starts, chIdx[k])
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

		filename := fmt.Sprintf("Second_Section_%d.txt", s+1)
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

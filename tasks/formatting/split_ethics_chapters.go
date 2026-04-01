package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// ethics.txt: Spinoza uses PART I / Part II / PART III / PART IV: / PART V: as part headers (PG Elwes).
// Section 1 = file start through end of Part I; sections 2–5 begin at each subsequent part line.
func main() {
	inputFile := "books/ethics.txt"
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

	// Standalone part headers only (avoids matching "Part I. I showed..." in body text).
	partHeader := regexp.MustCompile(`^(PART I\. CONCERNING GOD\.|Part II\.|PART III\.|PART IV:|PART V:)$`)
	var chIdx []int
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if partHeader.MatchString(t) {
			chIdx = append(chIdx, i)
		}
	}
	if len(chIdx) != 5 {
		fmt.Printf("Expected 5 Spinoza part header lines, found %d\n", len(chIdx))
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
	for k := 1; k < 5; k++ {
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

		filename := fmt.Sprintf("Ethics_Section_%d.txt", s+1)
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

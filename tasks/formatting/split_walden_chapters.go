package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Walden: body chapter titles are left-aligned (no leading space); TOC lines have a leading space.
func main() {
	inputFile := "books/Walden.txt"
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

	markers := []string{
		"Where I Lived, and What I Lived For",
		"Reading",
		"Sounds",
		"Solitude",
		"Visitors",
		"The Bean-Field",
		"The Village",
		"The Ponds",
		"Baker Farm",
		"Higher Laws",
		"Brute Neighbors",
		"House-Warming",
		"Former Inhabitants and Winter Visitors",
		"Winter Animals",
		"The Pond in Winter",
		"Spring",
		"Conclusion",
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

	findFirst := func(title string) int {
		for i, line := range lines {
			if line == title {
				return i
			}
		}
		return -1
	}

	var starts []int
	starts = append(starts, 0)

	for _, m := range markers {
		idx := findFirst(m)
		if idx == -1 {
			fmt.Printf("Missing marker: %q\n", m)
			return
		}
		starts = append(starts, idx)
	}

	dutyStarts := []int{}
	for i, line := range lines {
		if line == "ON THE DUTY OF CIVIL DISOBEDIENCE" {
			dutyStarts = append(dutyStarts, i)
		}
	}
	if len(dutyStarts) < 1 {
		fmt.Println("Missing ON THE DUTY OF CIVIL DISOBEDIENCE")
		return
	}
	lastDuty := dutyStarts[len(dutyStarts)-1]
	starts = append(starts, lastDuty)

	for i := 1; i < len(starts); i++ {
		if starts[i] <= starts[i-1] {
			fmt.Printf("Markers not strictly increasing at %d: %d vs %d\n", i, starts[i-1], starts[i])
			return
		}
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

		filename := fmt.Sprintf("Walden_Section_%d.txt", s+1)
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

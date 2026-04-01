package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	inputFile := "books/RUR.txt"
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

	// Match the main act headers in the body: "ACT ONE", "ACT TWO", "ACT THREE".
	// Skip the early TOC-style "ACT I", "ACT II", "ACT III" by starting after line ~280.
	var actStarts []int
	for i, line := range lines {
		if i < 280 {
			continue
		}
		trimmed := strings.TrimSpace(line)
		if trimmed == "ACT ONE" || trimmed == "ACT TWO" || trimmed == "ACT THREE" {
			actStarts = append(actStarts, i)
		}
	}

	if len(actStarts) == 0 {
		fmt.Println("No ACT markers found in RUR.txt")
		return
	}

	sectionCount := len(actStarts)
	fmt.Printf("Found %d acts (lines %v)\n", sectionCount, actStarts)

	// Section 1 = front matter + Act One.
	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	if sectionCount > 1 {
		sectionEnds[0] = actStarts[1] - 1
	} else {
		sectionEnds[0] = len(lines) - 1
	}

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = actStarts[i]
		if i+1 < sectionCount {
			sectionEnds[i] = actStarts[i+1] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("RUR_Section_%d.txt", i+1)
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
		fmt.Printf("Created: %s (Section %d, lines %d-%d)\n", filename, i+1, start+1, end+1)
	}
	fmt.Println("Done!")
}


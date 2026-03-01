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
	inputFile := "books/death.txt"
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

	// Match lines that contain a chapter heading like "CHAPTER ONE", "CHAPTER TWENTY", etc.
	chapterPattern := regexp.MustCompile(`\bCHAPTER [A-Za-z-]+\b`)

	var chapterStarts []int
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		// Skip the CONTENTS line "DEATH IN THE AFTERNOON, CHAPTERS I TO XX, ..."
		if strings.Contains(trimmed, "CHAPTERS I TO XX") {
			continue
		}
		if chapterPattern.MatchString(trimmed) {
			chapterStarts = append(chapterStarts, i)
		}
	}

	if len(chapterStarts) == 0 {
		fmt.Println("No chapter markers found in death.txt")
		return
	}

	sectionCount := len(chapterStarts)
	fmt.Printf("Found %d chapters (lines %v)\n", sectionCount, chapterStarts)

	// Section 1 MUST include all front matter (intro, licensing, etc.) plus Chapter One.
	// So we start Section 1 at line 0 and end it just before the Chapter Two marker.
	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	if sectionCount > 1 {
		sectionEnds[0] = chapterStarts[1] - 1
	} else {
		sectionEnds[0] = len(lines) - 1
	}

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = chapterStarts[i]
		if i+1 < sectionCount {
			sectionEnds[i] = chapterStarts[i+1] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("Death_Section_%d.txt", i+1)
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


package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"sort"
	"strings"
)

func main() {
	inputFile := "books/foryour.txt"
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

	// Five story titles (all caps, optional spaces). "FOR YOUR EYES ONLY" appears on cover (line ~36) and as story title (~1149); keep only the story start.
	storyTitles := []string{
		"FROM A VIEW TO A KILL",
		"FOR YOUR EYES ONLY",
		"QUANTUM OF SOLACE",
		"RISICO",
		"THE HILDEBRAND RARITY",
	}
	var chapterStarts []int
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if trimmed == "" {
			continue
		}
		// Normalize spaces for comparison (collapse multiple spaces)
		norm := strings.Join(strings.Fields(trimmed), " ")
		for _, title := range storyTitles {
			if norm == title {
				// Skip the cover "FOR YOUR EYES ONLY" (early in file)
				if title == "FOR YOUR EYES ONLY" && i < 500 {
					continue
				}
				chapterStarts = append(chapterStarts, i)
				break
			}
		}
	}

	// Remove duplicate FOR YOUR EYES ONLY if we got both; keep in order
	seen := make(map[int]bool)
	var unique []int
	for _, i := range chapterStarts {
		if !seen[i] {
			seen[i] = true
			unique = append(unique, i)
		}
	}
	chapterStarts = unique
	sort.Ints(chapterStarts)

	if len(chapterStarts) != 5 {
		fmt.Printf("Expected 5 story markers, found %d: %v\n", len(chapterStarts), chapterStarts)
		return
	}

	sectionCount := 5
	fmt.Printf("Found %d stories (lines %v)\n", sectionCount, chapterStarts)

	// Section 1 = front matter + first story; each section = one story.
	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	sectionEnds[0] = chapterStarts[1] - 1

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

		filename := fmt.Sprintf("ForYour_Section_%d.txt", i+1)
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

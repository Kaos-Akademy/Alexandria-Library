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
	inputFile := "books/machines.txt"
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

	// Story titles; contents at top list them, then each story body repeats its title.
	storyTitles := []string{
		"THE MACHINE STOPS",
		"THE POINT OF IT",
		"MR. ANDREWS",
		"CO-ORDINATION",
		"THE STORY OF THE SIREN",
		"THE ETERNAL MOMENT",
	}

	// Track the last occurrence of each title (body headers override contents).
	lastIndexByTitle := make(map[string]int)
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		for _, title := range storyTitles {
			if trimmed == title {
				lastIndexByTitle[title] = i
				break
			}
		}
	}

	var storyStarts []int
	for _, title := range storyTitles {
		if idx, ok := lastIndexByTitle[title]; ok {
			storyStarts = append(storyStarts, idx)
		}
	}

	sort.Ints(storyStarts)

	if len(storyStarts) != 6 {
		fmt.Printf("Expected 6 story markers, found %d: %v\n", len(storyStarts), storyStarts)
		return
	}

	sectionCount := len(storyStarts)
	fmt.Printf("Found %d stories (lines %v)\n", sectionCount, storyStarts)

	// Section 1 = front matter + first story; each later section = one story.
	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	sectionStarts[0] = 0
	sectionEnds[0] = storyStarts[1] - 1

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = storyStarts[i]
		if i+1 < sectionCount {
			sectionEnds[i] = storyStarts[i+1] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("Machines_Section_%d.txt", i+1)
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


package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

// Story titles as they appear in the file (standalone lines). Order must match CONTENTS.
var storyTitles = []string{
	"AN HONEST THIEF",
	"A NOVEL IN NINE LETTERS",
	"AN UNPLEASANT PREDICAMENT",
	"ANOTHER MAN'S WIFE",
	"THE HEAVENLY CHRISTMAS TREE",
	"THE PEASANT MAREY",
	"THE CROCODILE",
	"BOBOK",
	"THE DREAM OF A RIDICULOUS MAN",
}

func main() {
	inputFile := "books/stories.txt"
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

	// Find line index of each story title (first occurrence of each, in order)
	var storyStarts []int
	nextTitle := 0
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if nextTitle < len(storyTitles) && trimmed == storyTitles[nextTitle] {
			storyStarts = append(storyStarts, i)
			nextTitle++
		}
	}

	if len(storyStarts) != len(storyTitles) {
		fmt.Printf("Found %d of %d story markers\n", len(storyStarts), len(storyTitles))
		return
	}

	// Section 1 = from start of file (intro) through end of first story (include intro in Chapter 1)
	// Section i (i>=2) = from story i-1 start through story i start - 1; Section 9 = last story to end
	sectionStarts := make([]int, len(storyStarts))
	sectionEnds := make([]int, len(storyStarts))
	sectionStarts[0] = 0
	sectionEnds[0] = storyStarts[1] - 1
	for i := 1; i < len(storyStarts)-1; i++ {
		sectionStarts[i] = storyStarts[i]
		sectionEnds[i] = storyStarts[i+1] - 1
	}
	sectionStarts[len(storyStarts)-1] = storyStarts[len(storyStarts)-1]
	sectionEnds[len(storyStarts)-1] = len(lines) - 1

	fmt.Printf("Found %d stories. Section 1 includes intro (lines 1-%d).\n", len(storyStarts), sectionEnds[0]+1)

	for i := range sectionStarts {
		start, end := sectionStarts[i], sectionEnds[i]
		filename := fmt.Sprintf("Stories_Section_%d.txt", i+1)
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
		fmt.Printf("Created: %s (%s, lines %d-%d)\n", filename, storyTitles[i], start+1, end+1)
	}
	fmt.Println("Done!")
}

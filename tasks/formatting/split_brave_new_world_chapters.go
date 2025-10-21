package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

func main() {
	// Read the full book
	file, err := os.Open("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World.txt")
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	// Find chapter boundaries
	chapterRegex := regexp.MustCompile(`^Chapter ([IVX]+)$`)
	var chapterStarts []int
	var chapterNumbers []string

	for i, line := range lines {
		if chapterRegex.MatchString(strings.TrimSpace(line)) {
			chapterStarts = append(chapterStarts, i)
			match := chapterRegex.FindStringSubmatch(strings.TrimSpace(line))
			chapterNumbers = append(chapterNumbers, match[1])
		}
	}

	fmt.Printf("Found %d chapters\n", len(chapterStarts))
	for i, start := range chapterStarts {
		fmt.Printf("Chapter %s starts at line %d\n", chapterNumbers[i], start+1)
	}

	// Create chapter files
	for i, start := range chapterStarts {
		var end int
		if i+1 < len(chapterStarts) {
			end = chapterStarts[i+1]
		} else {
			end = len(lines)
		}

		chapterNum := chapterNumbers[i]
		filename := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Brave_New_World_Chapter_%s.txt", chapterNum)

		chapterFile, err := os.Create(filename)
		if err != nil {
			panic(err)
		}
		defer chapterFile.Close()

		// For Chapter I, include all content from the beginning
		var startLine int
		if chapterNum == "I" {
			startLine = 0
		} else {
			startLine = start
		}

		// Write chapter content
		for j := startLine; j < end; j++ {
			chapterFile.WriteString(lines[j] + "\n")
		}

		fmt.Printf("Created Chapter %s (%d lines)\n", chapterNum, end-startLine)
	}
}

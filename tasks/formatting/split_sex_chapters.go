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
	inputFile := "books/sex.txt"
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

	// Three main parts; same titles appear in contents (early lines), so only take matches after line 400.
	var chapterStarts []int
	for i, line := range lines {
		if i < 400 {
			continue
		}
		trimmed := strings.TrimSpace(line)
		if trimmed == "THE EVOLUTION OF MODESTY." {
			chapterStarts = append(chapterStarts, i)
		} else if trimmed == "THE PHENOMENA OF SEXUAL PERIODICITY." {
			chapterStarts = append(chapterStarts, i)
		} else if strings.HasPrefix(trimmed, "AUTO-EROTISM: A STUDY OF THE SPONTANEOUS MANIFESTATIONS OF THE SEXUAL") {
			chapterStarts = append(chapterStarts, i)
		}
	}

	sort.Ints(chapterStarts)

	if len(chapterStarts) != 3 {
		fmt.Printf("Expected 3 part markers, found %d: %v\n", len(chapterStarts), chapterStarts)
		return
	}

	sectionCount := 3
	fmt.Printf("Found %d parts (lines %v)\n", sectionCount, chapterStarts)

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

		filename := fmt.Sprintf("Sex_Section_%d.txt", i+1)
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

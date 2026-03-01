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
	inputFile := "books/inourtime.txt"
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

	// Markers are the inter-chapter vignettes (_CHAPTER I_ ... _CHAPTER XV_)
	// plus the closing _L’ENVOI_ piece.
	chapterRe := regexp.MustCompile(`^_CHAPTER [IVXLCDM]+_$`)
	lenvoiRe := regexp.MustCompile(`^_L[’']ENVOI_$`)

	var markers []int
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if chapterRe.MatchString(trimmed) || lenvoiRe.MatchString(trimmed) {
			markers = append(markers, i)
		}
	}

	if len(markers) == 0 {
		fmt.Println("No chapter markers found in inourtime.txt")
		return
	}

	sectionCount := len(markers) + 1 // section 1 = front matter + "On the Quai at Smyrna"
	fmt.Printf("Found %d markers (lines %v), creating %d sections\n", len(markers), markers, sectionCount)

	sectionStarts := make([]int, sectionCount)
	sectionEnds := make([]int, sectionCount)

	// Section 1 MUST include all front matter plus the opening story.
	sectionStarts[0] = 0
	sectionEnds[0] = markers[0] - 1

	for i := 1; i < sectionCount; i++ {
		sectionStarts[i] = markers[i-1]
		if i < sectionCount-1 {
			sectionEnds[i] = markers[i] - 1
		} else {
			sectionEnds[i] = len(lines) - 1
		}
	}

	for i := 0; i < sectionCount; i++ {
		start, end := sectionStarts[i], sectionEnds[i]

		filename := fmt.Sprintf("InOurTime_Section_%d.txt", i+1)
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


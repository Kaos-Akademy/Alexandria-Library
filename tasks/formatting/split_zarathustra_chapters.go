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
	inputFile := "books/zarathustra.txt"
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

	if len(lines) == 0 {
		fmt.Println("zarathustra.txt is empty; nothing to do")
		return
	}

	// Split by the 4 body-part headers (not the table-of-contents entries).
	firstPartRe := regexp.MustCompile(`^FIRST PART(\.|\. ZARATHUSTRA.?S DISCOURSES\.)$`)
	secondPartRe := regexp.MustCompile(`^THUS SPAKE ZARATHUSTRA\. SECOND PART\.$`)
	thirdPartRe := regexp.MustCompile(`^THIRD PART\.$`)
	fourthPartRe := regexp.MustCompile(`^FOURTH AND LAST PART\.$`)

	firstStart, secondStart, thirdStart, fourthStart := -1, -1, -1, -1
	for i, line := range lines {
		t := strings.TrimSpace(line)
		if firstPartRe.MatchString(t) {
			firstStart = i
		}
		if secondPartRe.MatchString(t) {
			secondStart = i
		}
		if thirdPartRe.MatchString(t) {
			thirdStart = i
		}
		if fourthPartRe.MatchString(t) {
			fourthStart = i
		}
	}

	if firstStart == -1 || secondStart == -1 || thirdStart == -1 || fourthStart == -1 {
		fmt.Println("Could not locate all four body part headers in zarathustra.txt")
		return
	}

	sectionStarts := []int{0, secondStart, thirdStart, fourthStart}
	sectionEnds := []int{secondStart - 1, thirdStart - 1, fourthStart - 1, len(lines) - 1}

	for i := 0; i < 4; i++ {
		start, end := sectionStarts[i], sectionEnds[i]
		filename := fmt.Sprintf("Zarathustra_Section_%d.txt", i+1)
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
		if err := writer.Flush(); err != nil {
			fmt.Printf("Error writing file %s: %v\n", outputPath, err)
		}
		outFile.Close()
		fmt.Printf("Created: %s (lines %d-%d)\n", filename, start+1, end+1)
	}
	fmt.Println("Done!")
}


package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	inputFile := "books/dispatches.txt"
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

	// This collection is ten dispatches; we keep it as a single on-chain section.
	start := 0
	end := len(lines) - 1

	filename := "Dispatches_Section_1.txt"
	outputPath := filepath.Join(outputDir, filename)

	outFile, err := os.Create(outputPath)
	if err != nil {
		fmt.Printf("Error creating file %s: %v\n", outputPath, err)
		return
	}
	defer outFile.Close()

	writer := bufio.NewWriter(outFile)
	for j := start; j <= end && j < len(lines); j++ {
		writer.WriteString(lines[j] + "\n")
	}
	writer.Flush()

	fmt.Printf("Created: %s (Section 1, lines %d-%d)\n", filename, start+1, end+1)
	fmt.Println("Done!")
}


package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	inputFile := "books/octopussy.txt"
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

	// Single story, no chapter markers: one section = entire file.
	fmt.Printf("Single section (lines 1-%d)\n", len(lines))

	filename := "Octopussy_Section_1.txt"
	outputPath := filepath.Join(outputDir, filename)

	outFile, err := os.Create(outputPath)
	if err != nil {
		fmt.Printf("Error creating file %s: %v\n", outputPath, err)
		return
	}
	writer := bufio.NewWriter(outFile)
	for _, line := range lines {
		writer.WriteString(line + "\n")
	}
	writer.Flush()
	outFile.Close()
	fmt.Printf("Created: %s (Section 1, lines 1-%d)\n", filename, len(lines))
	fmt.Println("Done!")
}

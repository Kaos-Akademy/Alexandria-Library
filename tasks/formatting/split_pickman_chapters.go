package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
)

func main() {
	inputFile := "books/pickman.txt"
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
		fmt.Println("pickman.txt is empty; nothing to do")
		return
	}

	filename := "Pickman_Section_1.txt"
	outputPath := filepath.Join(outputDir, filename)

	outFile, err := os.Create(outputPath)
	if err != nil {
		fmt.Printf("Error creating file %s: %v\n", outputPath, err)
		return
	}
	defer outFile.Close()

	writer := bufio.NewWriter(outFile)
	for _, line := range lines {
		writer.WriteString(line + "\n")
	}
	if err := writer.Flush(); err != nil {
		fmt.Printf("Error writing file %s: %v\n", outputPath, err)
		return
	}

	fmt.Printf("Created: %s (lines 1-%d)\n", filename, len(lines))
	fmt.Println("Done!")
}


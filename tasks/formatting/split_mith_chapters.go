package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	inputFile := "books/mith.txt"
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
		fmt.Println("mith.txt is empty; nothing to do")
		return
	}

	section2, section3, section4, section5 := -1, -1, -1, -1
	for i, line := range lines {
		t := strings.TrimSpace(line)
		switch t {
		case "_L’homme absurde_":
			if section2 == -1 {
				section2 = i
			}
		case "_La création absurde_":
			if section3 == -1 {
				section3 = i
			}
		case "_Le mythe de Sisyphe_":
			if section4 == -1 {
				section4 = i
			}
		case "_L’espoir et l’absurde dans l’œuvre de Franz Kafka_":
			if section5 == -1 {
				section5 = i
			}
		}
	}

	if section2 == -1 || section3 == -1 || section4 == -1 || section5 == -1 {
		fmt.Println("Could not find all expected section headers in mith.txt")
		return
	}

	starts := []int{0, section2, section3, section4, section5}
	ends := []int{section2 - 1, section3 - 1, section4 - 1, section5 - 1, len(lines) - 1}

	for i := range starts {
		filename := fmt.Sprintf("Mith_Section_%d.txt", i+1)
		outputPath := filepath.Join(outputDir, filename)

		outFile, err := os.Create(outputPath)
		if err != nil {
			fmt.Printf("Error creating file %s: %v\n", outputPath, err)
			continue
		}

		writer := bufio.NewWriter(outFile)
		for j := starts[i]; j <= ends[i] && j < len(lines); j++ {
			writer.WriteString(lines[j] + "\n")
		}
		if err := writer.Flush(); err != nil {
			fmt.Printf("Error writing file %s: %v\n", outputPath, err)
		}
		outFile.Close()
		fmt.Printf("Created: %s (lines %d-%d)\n", filename, starts[i]+1, ends[i]+1)
	}

	fmt.Println("Done!")
}


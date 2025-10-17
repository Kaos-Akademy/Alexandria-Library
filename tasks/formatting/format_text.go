package main

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"strings"
)

func main() {
	if len(os.Args) != 3 {
		fmt.Println("Usage: go run format_text.go <input_file> <output_file>")
		os.Exit(1)
	}

	inputPath := os.Args[1]
	outputPath := os.Args[2]

	err := FormatText(inputPath, outputPath)
	if err != nil {
		fmt.Printf("Error processing file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully processed %s. Output written to: %s\n", inputPath, outputPath)
}

// FormatText reads a text file and combines multiple lines of each paragraph
// into a single line. Paragraphs are identified by empty lines between them.
func FormatText(inputPath, outputPath string) error {
	// Open input file
	input, err := os.Open(inputPath)
	if err != nil {
		return err
	}
	defer input.Close()

	// Create output file
	output, err := os.Create(outputPath)
	if err != nil {
		return err
	}
	defer output.Close()

	scanner := bufio.NewScanner(input)
	var currentParagraph bytes.Buffer

	for scanner.Scan() {
		line := scanner.Text()
		trimmedLine := strings.TrimSpace(line)

		// If we encounter an empty line, it's a paragraph break
		if trimmedLine == "" {
			// Write the current paragraph if we have one
			if currentParagraph.Len() > 0 {
				_, err := output.Write(currentParagraph.Bytes())
				if err != nil {
					return err
				}
				_, err = output.Write([]byte("\n"))
				if err != nil {
					return err
				}
				currentParagraph.Reset()
			}
			// Write an empty line to maintain paragraph separation
			_, err := output.Write([]byte("\n"))
			if err != nil {
				return err
			}
		} else {
			// If the current paragraph already has content, add a space
			if currentParagraph.Len() > 0 {
				currentParagraph.WriteString(" ")
			}
			currentParagraph.WriteString(trimmedLine)
		}
	}

	// Write the last paragraph if there is one
	if currentParagraph.Len() > 0 {
		_, err := output.Write(currentParagraph.Bytes())
		if err != nil {
			return err
		}
		_, err = output.Write([]byte("\n"))
		if err != nil {
			return err
		}
	}

	return scanner.Err()
}

package formatting

import (
	"bufio"
	"bytes"
	"io"
	"os"
	"strings"
)

// CombineParagraphLines reads a text file and combines multiple lines of each paragraph
// into a single line. Paragraphs are identified by empty lines between them.
func CombineParagraphLines(inputPath, outputPath string) error {
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

	return ProcessParagraphs(input, output)
}

// ProcessParagraphs handles the actual paragraph processing logic
func ProcessParagraphs(reader io.Reader, writer io.Writer) error {
	scanner := bufio.NewScanner(reader)
	var currentParagraph bytes.Buffer

	for scanner.Scan() {
		line := scanner.Text()
		trimmedLine := strings.TrimSpace(line)

		// If we encounter an empty line, it's a paragraph break
		if trimmedLine == "" {
			// Write the current paragraph if we have one
			if currentParagraph.Len() > 0 {
				_, err := writer.Write(currentParagraph.Bytes())
				if err != nil {
					return err
				}
				_, err = writer.Write([]byte("\n"))
				if err != nil {
					return err
				}
				currentParagraph.Reset()
			}
			// Write an empty line to maintain paragraph separation
			_, err := writer.Write([]byte("\n"))
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
		_, err := writer.Write(currentParagraph.Bytes())
		if err != nil {
			return err
		}
		_, err = writer.Write([]byte("\n"))
		if err != nil {
			return err
		}
	}

	return scanner.Err()
}

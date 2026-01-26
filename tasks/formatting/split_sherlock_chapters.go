package main

import (
	"bufio"
	"fmt"
	"os"
	"regexp"
	"strings"
)

// romanToInt converts a Roman numeral to an integer
func romanToInt(s string) int {
	values := map[byte]int{
		'I': 1,
		'V': 5,
		'X': 10,
		'L': 50,
		'C': 100,
		'D': 500,
		'M': 1000,
	}
	n := 0
	prev := 0
	for i := len(s) - 1; i >= 0; i-- {
		v := values[s[i]]
		if v < prev {
			n -= v
		} else {
			n += v
		}
		prev = v
	}
	return n
}

func main() {
	// Path to the full book text
	inputPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/sherlock.txt"

	file, err := os.Open(inputPath)
	if err != nil {
		panic(err)
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}
	if err := scanner.Err(); err != nil {
		panic(err)
	}

	// Adventure headings look like:
	// I. A SCANDAL IN BOHEMIA
	// II. THE RED-HEADED LEAGUE
	// III. A CASE OF IDENTITY
	// ...
	// XII. THE ADVENTURE OF THE COPPER BEECHES
	// Pattern: Roman numeral + period + space + UPPERCASE TITLE (permissive - any non-lowercase characters)
	adventureRegex := regexp.MustCompile(`^\s*([IVXLCDM]+)\.\s+([A-Z][^a-z]+[A-Z])$`)
	var adventureStarts []int
	var adventureLabels []string

	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if adventureRegex.MatchString(trimmed) {
			match := adventureRegex.FindStringSubmatch(trimmed)
			adventureStarts = append(adventureStarts, i)
			adventureLabels = append(adventureLabels, match[1])
		}
	}

	if len(adventureStarts) == 0 {
		panic("no adventure headings found")
	}

	fmt.Printf("Found %d adventures in The Adventures of Sherlock Holmes\n", len(adventureStarts))
	for i, start := range adventureStarts {
		fmt.Printf("Adventure %s starts at line %d\n", adventureLabels[i], start+1)
	}

	// Create adventure files
	for i, start := range adventureStarts {
		var end int
		if i+1 < len(adventureStarts) {
			end = adventureStarts[i+1]
		} else {
			end = len(lines)
		}

		advLabel := adventureLabels[i]

		// Output path: one txt file per adventure
		outPath := fmt.Sprintf("/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/books/Sherlock_Adventure_%s.txt", advLabel)

		outFile, err := os.Create(outPath)
		if err != nil {
			panic(err)
		}

		// Adventure I must contain everything before it as well (introduction, etc.)
		startLine := start
		if advLabel == "I" {
			startLine = 0
		}

		var processedLines []string
		var currentParagraph strings.Builder

		for j := startLine; j < end; j++ {
			line := lines[j]
			trimmed := strings.TrimSpace(line)

			// Paragraph break on empty line
			if trimmed == "" {
				if currentParagraph.Len() > 0 {
					processedLines = append(processedLines, currentParagraph.String())
					currentParagraph.Reset()
				}
				// Keep a blank line as a separator
				processedLines = append(processedLines, "")
				continue
			}

			// First line of a new paragraph
			if currentParagraph.Len() == 0 {
				currentParagraph.WriteString(trimmed)
			} else {
				// Continue same paragraph with a space
				currentParagraph.WriteString(" " + trimmed)
			}
		}

		// Flush last paragraph, if any
		if currentParagraph.Len() > 0 {
			processedLines = append(processedLines, currentParagraph.String())
		}

		// Write each paragraph / separator as one line in the txt file
		for _, pl := range processedLines {
			_, err := outFile.WriteString(pl + "\n")
			if err != nil {
				outFile.Close()
				panic(err)
			}
		}
		outFile.Close()

		advIndex := romanToInt(advLabel)
		fmt.Printf("Created Sherlock_Adventure_%s.txt (index %d, %d source lines, %d paragraph lines)\n",
			advLabel, advIndex, end-startLine, len(processedLines))
	}

	fmt.Println("All Sherlock Holmes adventure files have been created as plain txt with one paragraph per line.")
}

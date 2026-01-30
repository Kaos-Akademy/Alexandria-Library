package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

// Section represents a section of the Epic
type Section struct {
	Title    string
	StartIdx int
	EndIdx   int
}

func main() {
	inputFile := "books/gilgamesh.txt"
	outputDir := "books"

	file, err := os.Open(inputFile)
	if err != nil {
		fmt.Printf("Error opening file: %v\n", err)
		return
	}
	defer file.Close()

	var lines []string
	scanner := bufio.NewScanner(file)
	// Increase buffer size for long lines
	buf := make([]byte, 0, 64*1024)
	scanner.Buffer(buf, 1024*1024)
	
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
	}

	if err := scanner.Err(); err != nil {
		fmt.Printf("Error reading file: %v\n", err)
		return
	}

	fmt.Printf("Total lines: %d\n", len(lines))

	// Define section markers for the TRANSLATION part only
	// We want to extract the readable English translation, not the transliteration
	sections := []Section{}
	
	// Find Introduction
	introStart := -1
	introEnd := -1
	translationStart := -1
	indexStart := -1
	
	// Regex patterns
	introPattern := regexp.MustCompile(`^INTRODUCTION\s*$`)
	translitPattern := regexp.MustCompile(`^TRANSLITERATION\s*$`)
	translationPattern := regexp.MustCompile(`^TRANSLATION\s*$`)
	colPattern := regexp.MustCompile(`^COL\.\s+(I{1,3}|II|III)`)
	reversePattern := regexp.MustCompile(`^REVERSE\s+(I{1,3}|II|III)`)
	indexPattern := regexp.MustCompile(`^INDEX`)
	tabletPattern := regexp.MustCompile(`^\s*duppu\s+\d+`)
	
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		
		if introPattern.MatchString(trimmed) {
			introStart = i
		}
		if translitPattern.MatchString(trimmed) && introStart >= 0 {
			introEnd = i - 1
		}
		if translationPattern.MatchString(trimmed) {
			translationStart = i
		}
		if indexPattern.MatchString(trimmed) {
			indexStart = i
		}
	}
	
	fmt.Printf("Introduction: %d-%d\n", introStart, introEnd)
	fmt.Printf("Translation starts: %d\n", translationStart)
	fmt.Printf("Index starts: %d\n", indexStart)
	
	// Add Introduction section
	if introStart >= 0 && introEnd > introStart {
		sections = append(sections, Section{
			Title:    "Introduction",
			StartIdx: introStart,
			EndIdx:   introEnd,
		})
	}
	
	// Now find sections within the TRANSLATION part
	if translationStart >= 0 {
		endIdx := indexStart
		if endIdx < 0 {
			endIdx = len(lines)
		}
		
		// Find all COL and REVERSE markers within translation section
		currentTitle := "Column I" // Translation section starts with implied Column I
		currentStart := translationStart + 2 // Skip "TRANSLATION" header and blank line
		
		for i := translationStart; i < endIdx; i++ {
			trimmed := strings.TrimSpace(lines[i])
			
			// Check for tablet end marker
			if tabletPattern.MatchString(trimmed) {
				// End current section before tablet marker
				if currentStart > 0 && currentStart < i {
					sections = append(sections, Section{
						Title:    currentTitle,
						StartIdx: currentStart,
						EndIdx:   i + 3, // Include tablet marker
					})
				}
				break
			}
			
			if colMatch := colPattern.FindStringSubmatch(trimmed); colMatch != nil {
				// Save previous section
				if currentStart > 0 && currentStart < i-1 {
					sections = append(sections, Section{
						Title:    currentTitle,
						StartIdx: currentStart,
						EndIdx:   i - 1,
					})
				}
				currentTitle = "Column " + colMatch[1]
				currentStart = i + 2 // Skip header and blank line
			}
			
			if reverseMatch := reversePattern.FindStringSubmatch(trimmed); reverseMatch != nil {
				// Save previous section
				if currentStart > 0 && currentStart < i-1 {
					sections = append(sections, Section{
						Title:    currentTitle,
						StartIdx: currentStart,
						EndIdx:   i - 1,
					})
				}
				currentTitle = "Reverse " + reverseMatch[1]
				currentStart = i + 2 // Skip header and blank line
			}
		}
	}
	
	fmt.Printf("\nFound %d sections:\n", len(sections))
	for i, s := range sections {
		fmt.Printf("  %d. %s (lines %d-%d)\n", i+1, s.Title, s.StartIdx+1, s.EndIdx+1)
	}
	
	// Write each section to a file
	for i, section := range sections {
		filename := fmt.Sprintf("Gilgamesh_Section_%d.txt", i+1)
		outputPath := filepath.Join(outputDir, filename)
		
		outFile, err := os.Create(outputPath)
		if err != nil {
			fmt.Printf("Error creating file %s: %v\n", outputPath, err)
			continue
		}
		
		writer := bufio.NewWriter(outFile)
		
		for j := section.StartIdx; j <= section.EndIdx && j < len(lines); j++ {
			line := lines[j]
			// Convert each paragraph to a single line
			trimmed := strings.TrimSpace(line)
			if trimmed != "" {
				writer.WriteString(trimmed + "\n")
			}
		}
		
		writer.Flush()
		outFile.Close()
		
		fmt.Printf("Created: %s (%s)\n", filename, section.Title)
	}
	
	fmt.Println("\nDone!")
}

package main

import (
	"bufio"
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

func main() {
	if len(os.Args) != 2 {
		fmt.Println("Usage: go run split_chapters.go <input_file>")
		os.Exit(1)
	}

	inputPath := os.Args[1]
	err := splitIntoChapters(inputPath)
	if err != nil {
		fmt.Printf("Error processing file: %v\n", err)
		os.Exit(1)
	}
}

func splitIntoChapters(inputPath string) error {
	file, err := os.Open(inputPath)
	if err != nil {
		return err
	}
	defer file.Close()

	// First read the title and header which should be included in every chapter
	titleAndHeader, err := readTitleAndHeader(file)
	if err != nil {
		return err
	}

	// Reset file pointer to start
	if _, err := file.Seek(0, 0); err != nil {
		return err
	}

	scanner := bufio.NewScanner(file)
	var currentChapter strings.Builder
	chapterNum := 0
	inChapter := false
	baseDir := filepath.Dir(inputPath)
	baseName := strings.TrimSuffix(filepath.Base(inputPath), filepath.Ext(inputPath))

	for scanner.Scan() {
		line := scanner.Text()
		trimmedLine := strings.TrimSpace(line)

		// Check for chapter start
		if strings.HasPrefix(trimmedLine, "Chapter") {
			// If we were in a chapter, save the previous one
			if inChapter {
				err := saveChapter(baseDir, baseName, chapterNum, currentChapter.String())
				if err != nil {
					return err
				}
			}
			chapterNum++
			currentChapter.Reset()
			// Add title and header for new chapter
			currentChapter.WriteString(titleAndHeader)
			currentChapter.WriteString("PART ONE\n\n")
			currentChapter.WriteString(fmt.Sprintf("Chapter %d\n\n\n", chapterNum))
			inChapter = true
			continue
		}

		// Add line to current chapter if we're in a chapter
		if inChapter {
			currentChapter.WriteString(line + "\n")
		}
	}

	// Save the last chapter
	if inChapter {
		err := saveChapter(baseDir, baseName, chapterNum, currentChapter.String())
		if err != nil {
			return err
		}
	}

	if err := scanner.Err(); err != nil {
		return err
	}

	fmt.Printf("Successfully split into %d chapters\n", chapterNum)
	return nil
}

func readTitleAndHeader(file *os.File) (string, error) {
	scanner := bufio.NewScanner(file)
	var header strings.Builder

	// Read until we find the title line
	for scanner.Scan() {
		line := scanner.Text()
		if strings.Contains(line, "Title:") {
			header.WriteString(line + "\n\n\n")
			break
		}
	}

	return header.String(), scanner.Err()
}

func saveChapter(baseDir, baseName string, chapterNum int, content string) error {
	outputPath := filepath.Join(baseDir, fmt.Sprintf("%s.chapter%d.txt", baseName, chapterNum))
	return os.WriteFile(outputPath, []byte(content), 0644)
}

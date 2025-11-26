package main

import (
	"bufio"
	"bytes"
	"encoding/base64"
	"fmt"
	"image"
	"image/jpeg"
	_ "image/png" // Register PNG decoder
	"os"
	"path/filepath"
	"regexp"
	"sort"
	"strings"

	//if you imports this with .  you do not have to repeat overflow everywhere
	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
	"golang.org/x/image/draw"
)

// ReadFile reads a text file and returns an array of paragraphs
func ReadFile(filename string) ([]string, error) {
	file, err := os.Open(filename)
	if err != nil {
		return nil, err
	}
	defer file.Close()

	var content string
	scanner := bufio.NewScanner(file)

	// Read file content line by line
	for scanner.Scan() {
		content += scanner.Text() + "\n"
	}

	if err := scanner.Err(); err != nil {
		return nil, err
	}

	// Split the content into paragraphs
	// Assuming paragraphs are separated by one or more newlines
	rawParagraphs := strings.Split(content, "\n")
	paragraphs := make([]string, 0, len(rawParagraphs))

	for _, paragraph := range rawParagraphs {
		trimmed := strings.TrimSpace(paragraph)
		if trimmed != "" {
			paragraphs = append(paragraphs, trimmed) // Add non-empty paragraphs
		}
	}

	return paragraphs, nil
}

// EncodeImageToBase64 reads an image file, resizes if needed, converts PNG to JPG if needed, and encodes it to base64 string
func EncodeImageToBase64(imagePath string) (string, error) {
	// Read the image file
	imageData, err := os.ReadFile(imagePath)
	if err != nil {
		return "", fmt.Errorf("failed to read image file: %w", err)
	}

	originalSize := len(imageData)

	// Decode the image
	img, format, err := image.Decode(bytes.NewReader(imageData))
	if err != nil {
		return "", fmt.Errorf("failed to decode image: %w", err)
	}

	// Get image bounds
	bounds := img.Bounds()
	width := bounds.Dx()
	height := bounds.Dy()
	maxWidth := 2000 // Maximum width to keep under transaction limit

	// Resize if image is too large
	var processedImg image.Image = img
	if width > maxWidth {
		// Calculate new height maintaining aspect ratio
		newHeight := height * maxWidth / width

		// Create new image with target size
		resized := image.NewRGBA(image.Rect(0, 0, maxWidth, newHeight))
		draw.BiLinear.Scale(resized, resized.Bounds(), img, bounds, draw.Over, nil)
		processedImg = resized

		color.Yellow("Resized image from %dx%d to %dx%d", width, height, maxWidth, newHeight)
	}

	// Convert to JPEG (always convert to ensure consistent compression)
	var buf bytes.Buffer
	// Use quality 70 for better compression (still good quality for manga/comics)
	err = jpeg.Encode(&buf, processedImg, &jpeg.Options{Quality: 70})
	if err != nil {
		return "", fmt.Errorf("failed to encode image as JPEG: %w", err)
	}
	jpegData := buf.Bytes()

	// Log the conversion
	if format != "jpeg" && format != "jpg" {
		color.Yellow("Converted %s image (%d bytes) to JPEG (%d bytes) - %.1f%% size reduction",
			format, originalSize, len(jpegData),
			float64(originalSize-len(jpegData))/float64(originalSize)*100)
	} else {
		color.Yellow("Compressed JPEG image (%d bytes) to (%d bytes) - %.1f%% size reduction",
			originalSize, len(jpegData),
			float64(originalSize-len(jpegData))/float64(originalSize)*100)
	}

	// Check if still too large (base64 will be ~33% larger)
	base64Size := len(jpegData) * 4 / 3
	if base64Size > 1400000 { // Leave some margin under 1.5MB
		color.Red("Warning: Base64 size will be ~%d bytes, may still exceed transaction limit", base64Size)
	}

	// Encode to base64
	base64String := base64.StdEncoding.EncodeToString(jpegData)

	return base64String, nil
}

// UploadImagesFromDirectory uploads all images starting from a given page number
func UploadImagesFromDirectory(
	o *OverflowState,
	directoryPath string,
	startPage string, // e.g., "p011"
	bookTitle string,
	chapterTitle string,
	signer string,
) error {
	// Read directory
	entries, err := os.ReadDir(directoryPath)
	if err != nil {
		return fmt.Errorf("failed to read directory: %w", err)
	}

	// Filter and collect image files
	imageExts := map[string]bool{".png": true, ".jpg": true, ".jpeg": true}
	pageRegex := regexp.MustCompile(`p(\d+)`)
	startPageNum := -1

	// Extract starting page number
	if matches := pageRegex.FindStringSubmatch(startPage); len(matches) > 1 {
		fmt.Sscanf(matches[1], "%d", &startPageNum)
	}

	if startPageNum == -1 {
		return fmt.Errorf("invalid start page format: %s (expected format like 'p011')", startPage)
	}

	color.Cyan("Looking for images starting from page %s (page number %d)", startPage, startPageNum)

	// Collect all image files with their page numbers
	type fileWithPage struct {
		path     string
		pageNum  int
		filename string
	}
	var filesWithPages []fileWithPage

	for _, entry := range entries {
		if entry.IsDir() {
			continue
		}

		ext := strings.ToLower(filepath.Ext(entry.Name()))
		if !imageExts[ext] {
			continue
		}

		// Extract page number from filename
		matches := pageRegex.FindStringSubmatch(entry.Name())
		if len(matches) < 2 {
			continue
		}

		var pageNum int
		if _, err := fmt.Sscanf(matches[1], "%d", &pageNum); err != nil {
			continue
		}

		// Only include files from startPage onwards
		if pageNum >= startPageNum {
			fullPath := filepath.Join(directoryPath, entry.Name())
			filesWithPages = append(filesWithPages, fileWithPage{
				path:     fullPath,
				pageNum:  pageNum,
				filename: entry.Name(),
			})
		}
	}

	// Sort by page number
	sort.Slice(filesWithPages, func(i, j int) bool {
		return filesWithPages[i].pageNum < filesWithPages[j].pageNum
	})

	if len(filesWithPages) == 0 {
		return fmt.Errorf("no image files found starting from page %s", startPage)
	}

	color.Green("Found %d images to upload, starting from page %d", len(filesWithPages), startPageNum)

	// Upload each image
	for i, fileInfo := range filesWithPages {
		color.Cyan("\n[%d/%d] Processing: %s (page %d)", i+1, len(filesWithPages), fileInfo.filename, fileInfo.pageNum)

		// Encode image
		imageBase64, err := EncodeImageToBase64(fileInfo.path)
		if err != nil {
			color.Red("Failed to encode %s: %v", fileInfo.filename, err)
			return fmt.Errorf("failed to encode %s: %w", fileInfo.filename, err)
		}

		// Upload to blockchain
		color.Yellow("Uploading to blockchain...")
		result := o.Tx("Librerian/add_paragraph_to_chapter",
			WithSigner(signer),
			WithArg("bookTitle", bookTitle),
			WithArg("chapterTitle", chapterTitle),
			WithArg("paragraph", imageBase64),
		)

		if result.Err != nil {
			color.Red("Failed to upload %s: %v", fileInfo.filename, result.Err)
			return fmt.Errorf("failed to upload %s: %w", fileInfo.filename, result.Err)
		}

		color.Green("✓ Successfully uploaded %s (page %d)", fileInfo.filename, fileInfo.pageNum)
		result.Print()
	}

	color.Green("\n✓ All %d images uploaded successfully!", len(filesWithPages))
	return nil
}

func main() {
	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	color.Red("Alexandria Contract - Batch Image Upload")
	color.Red("")

	// Configuration
	directoryPath := "/Users/noahnaizir/Documents/GitHub/Kaos/Alexandria-Library/images/Berserk v01 (2003) (Digital) (Cyborgzx-repack)"
	startPage := "p011" // Start from page 11
	bookTitle := "Berserk"
	chapterTitle := "Chapter I"
	signer := "Prime-librarian"

	// Upload all images starting from p011
	err := UploadImagesFromDirectory(o, directoryPath, startPage, bookTitle, chapterTitle, signer)
	if err != nil {
		color.Red("Error: %v", err)
		os.Exit(1)
	}
}

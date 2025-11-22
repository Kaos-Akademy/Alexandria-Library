package main

import (
	"encoding/base64"
	"fmt"
	"os"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
)

// EncodeImageToBase64 reads an image file and encodes it to base64 string
func EncodeImageToBase64(imagePath string) (string, error) {
	// Read the image file
	imageData, err := os.ReadFile(imagePath)
	if err != nil {
		return "", fmt.Errorf("failed to read image file: %w", err)
	}

	// Encode to base64
	base64String := base64.StdEncoding.EncodeToString(imageData)

	return base64String, nil
}

// UploadImageAsParagraph encodes an image and uploads it as a single paragraph to a chapter
func UploadImageAsParagraph(
	o *OverflowState,
	imagePath string,
	bookTitle string,
	chapterTitle string,
	chapterIndex int,
	signer string,
) error {
	// Encode image to base64
	color.Cyan("Encoding image: %s", imagePath)
	base64String, err := EncodeImageToBase64(imagePath)
	if err != nil {
		return fmt.Errorf("failed to encode image: %w", err)
	}

	// Get file info for logging
	fileInfo, err := os.Stat(imagePath)
	if err == nil {
		color.Green("Image encoded successfully. Original size: %d bytes, Base64 size: %d bytes",
			fileInfo.Size(), len(base64String))
	}

	// Create paragraphs array with single base64 image
	paragraphs := []string{base64String}

	// Upload as chapter (this will replace the entire chapter)
	color.Yellow("Uploading image as paragraph to chapter: %s", chapterTitle)
	result := o.Tx("Librerian/add_chapter",
		WithSigner(signer),
		WithArg("bookTitle", bookTitle),
		WithArg("chapterTitle", chapterTitle),
		WithArg("index", chapterIndex),
		WithArg("paragraphs", paragraphs),
	)

	result.Print()

	if result.Err != nil {
		return fmt.Errorf("failed to upload image: %w", result.Err)
	}

	color.Green("Successfully uploaded image as paragraph!")
	return nil
}

func main() {
	// Example usage
	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	// Example: Upload a single image
	imagePath := "images/Berserk v01 (2003) (Digital) (Cyborgzx-repack)/Berserk - 001 (v01) - p001 [Digital] [Cyborgzx-repack].jpg"
	bookTitle := "Berserk"
	chapterTitle := "Chapter I"
	chapterIndex := 1
	signer := "Prime-librarian"

	err := UploadImageAsParagraph(o, imagePath, bookTitle, chapterTitle, chapterIndex, signer)
	if err != nil {
		color.Red("Error: %v", err)
		os.Exit(1)
	}
}

package main

import (
	"bufio"
	"encoding/base64"
	"fmt"
	"os"
	"strings"

	//if you imports this with .  you do not have to repeat overflow everywhere
	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
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

func main() {

	// Encode image to base64
	imageBase64, err := EncodeImageToBase64("images/Berserk v01 (2003) (Digital) (Cyborgzx-repack)/Berserk - 001 (v01) - p000.jpg")
	if err != nil {
		fmt.Printf("Error encoding image: %v\n", err)
		os.Exit(1)
	}

	// Create paragraphs array with the base64 image string
	paragraphs1 := []string{imageBase64}

	fmt.Printf("Successfully encoded image. Base64 length: %d characters\n", len(imageBase64))

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	fmt.Println("Testing Contract")
	/* 	fmt.Println("Press any key to continue")
	   	fmt.Scanln() */

	color.Red("Alexandria Contract testing")

	color.Red("")

	// o.Script("get_book_titles")

	// Add a book
	/* 	o.Tx("Librerian/add_book",
	   		WithSigner("Prime-librarian"),
	   		WithArg("title", "Berserk"),
	   		WithArg("author", "Kentaro Miura"),
	   		WithArg("genre", "Manga"),
	   		WithArg("edition", "First Edition"),
	   		WithArg("summary", "Berserk is a Japanese manga series written and illustrated by Kentaro Miura. It was serialized in Weekly Shōnen Magazine from 1989 to 2002, with the chapters collected into 38 tankobon volumes by Hakusensha. The story follows the life of Guts, a skilled swordsman who becomes known as the Black Swordsman after severing the arm of a demon lord. He is then adopted by the bandit Griffith and joins his band of mercenaries, the Band of the Hawk, as they seek to fulfill Griffith's dream of creating a kingdom."),
	   	).Print()

	   	// Add a chapter title to a book
	   	o.Tx("Librerian/add_chapter_name",
	   		WithSigner("Prime-librarian"),
	   		WithArg("bookTitle", "Berserk"),
	   		WithArg("chapterTitle", "Chapter I"),
	   	).Print()
	*/
	// Add a chapter to a book
	o.Tx("Librerian/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Berserk"),
		WithArg("chapterTitle", "Chapter I"),
		WithArg("index", 1),
		WithArg("paragraphs", paragraphs1),
	).Print()
	/* 	o.Script("get_books_by_author",
	   		WithArg("author", "George Orwell"),
	   	).Print()
	   	o.Script("get_book",
	   		WithArg("bookTitle", "Nineteen eighty-four"),
	   	).Print()
	   	o.Script("get_book_chapter",
	   		WithArg("bookTitle", "Nineteen eighty-four"),
	   		WithArg("chapterTitle", "Chapter 5"),
	   	).Print() */

	/// REMOVE CHAPTER
	/* 	o.Tx("Librerian/remove_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Berserk"),
		WithArg("chapterTitle", "Chapter I"),
	).Print() */
}

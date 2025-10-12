package main

import (
	"bufio"
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

func main() {

	// Read the manifesto text file and parse into paragraphs
	paragraphs1, err := ReadFile("books/manifesto.txt")
	if err != nil {
		fmt.Printf("Error reading manifesto file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully loaded %d paragraphs from manifesto.txt\n", len(paragraphs1))

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	fmt.Println("Testing Contract")
	fmt.Println("Press any key to continue")
	fmt.Scanln()

	color.Red("Alexandria Contract testing")

	color.Red("")

	// o.Script("get_book_titles")

	// Add a book
	o.Tx("Admin/add_book",
		WithSigner("Prime-librarian"),
		WithArg("title", "The Cypherpunk Manifesto"),
		WithArg("author", "Eric Hughes"),
		WithArg("genre", "Cryptography"),
		WithArg("edition", "First Edition"),
		WithArg("summary", "The Cypherpunk Manifesto remains one of the most influential texts in the history of digital privacy and cryptocurrency. Written in 1993 by Eric Hughes, it became a rallying cry for developers, activists, and technologists who believed in the transformative power of cryptography. Today, as Bitcoin and blockchain technology shape the financial and digital landscapes, the manifesto’s themes of privacy, autonomy, and freedom are more relevant than ever."),
	).Print()
	o.Script("get_book",
		WithArg("bookTitle", "The Cypherpunk Manifesto"),
	).Print()
	o.Script("get_books_by_genre",
		WithArg("genre", "Cryptography"),
	).Print()
	o.Script("get_genres").Print()
	o.Script("get_books_by_author",
		WithArg("author", "Eric Hughes"),
	).Print()
	// Add a chapter title to a book
	o.Tx("Admin/add_chapter_name",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "The Cypherpunk Manifesto"),
		WithArg("chapterTitle", "I"),
	).Print()
	// Add a chapter to a book
	o.Tx("Admin/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "The Cypherpunk Manifesto"),
		WithArg("chapterTitle", "I"),
		WithArg("index", 1),
		WithArg("paragraphs", paragraphs1),
	).Print()
	o.Script("get_books_by_author",
		WithArg("author", "Eric Hughes"),
	).Print()
	o.Script("get_book",
		WithArg("bookTitle", "The Cypherpunk Manifesto"),
	).Print()
	o.Script("get_book_chapter",
		WithArg("bookTitle", "The Cypherpunk Manifesto"),
		WithArg("chapterTitle", "I"),
	).Print()

}

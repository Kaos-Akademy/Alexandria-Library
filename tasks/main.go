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
	paragraphs1, err := ReadFile("books/Brave_New_World_Chapter_VII.txt")
	if err != nil {
		fmt.Printf("Error reading Brave New World chapter 5 file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully loaded %d paragraphs from Brave New World chapter 5\n", len(paragraphs1))

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
	/* 	o.Tx("Admin/add_book",
		WithSigner("Prime-librarian"),
		WithArg("title", "Brave New World"),
		WithArg("author", "Aldous Leonard Huxley"),
		WithArg("genre", "Dystopian"),
		WithArg("edition", "First Edition"),
		WithArg("summary", "Brave New World by Aldous Huxley (1932) imagines a future where humanity has traded freedom for comfort and control. In this “perfect” society, people are genetically engineered, conditioned from birth, and kept docile through pleasure, consumerism, and a drug called soma. Pain, individuality, and genuine emotion are eliminated — but so is meaning. When an outsider raised in the natural world is brought into this engineered utopia, he exposes the emptiness beneath its happiness. It’s a haunting vision of a world where humanity’s greatest danger isn’t oppression by force, but enslavement by satisfaction."),
	).Print() */
	/* 	o.Script("get_book",
	   		WithArg("bookTitle", "Brave New World"),
	   	).Print()
	   	o.Script("get_books_by_genre",
	   		WithArg("genre", "Dystopian"),
	   	).Print()
	   	o.Script("get_genres").Print()
	   	o.Script("get_books_by_author",
	   		WithArg("author", "Aldous Leonard Huxley"),
	   	).Print() */
	// Add a chapter title to a book
	o.Tx("Admin/add_chapter_name",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Brave New World"),
		WithArg("chapterTitle", "Chapter VII"),
	).Print()

	// Add a chapter to a book
	o.Tx("Admin/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Brave New World"),
		WithArg("chapterTitle", "Chapter VII"),
		WithArg("index", 7),
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
	/* 	o.Tx("Admin/remove_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Nineteen eighty-four"),
		WithArg("chapterTitle", "Chapter 9"),
	).Print() */
}

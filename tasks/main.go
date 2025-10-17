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
	paragraphs1, err := ReadFile("books/1984_PART_TWO_Chapter_4.txt")
	if err != nil {
		fmt.Printf("Error reading 1984 chapter 9 file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully loaded %d paragraphs from 1984 chapter 9\n", len(paragraphs1))

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
	   		WithArg("title", "Nineteen eighty-four"),
	   		WithArg("author", "George Orwell"),
	   		WithArg("genre", "Dystopian"),
	   		WithArg("edition", "First Edition"),
	   		WithArg("summary", "1984 by George Orwell is a dystopian novel set in a totalitarian state called Oceania, where the government—led by the mysterious Big Brother—controls every aspect of citizens’ lives. The story follows Winston Smith, a low-ranking worker at the Ministry of Truth, whose job is to rewrite historical records to fit the Party’s propaganda. Disillusioned with constant surveillance, censorship, and manipulation of truth, Winston begins secretly rebelling by keeping a diary and falling in love with Julia, another dissenter. At its core, 1984 is a chilling warning about surveillance, truth control, and the loss of individuality under absolute power."),
	   	).Print()
	   	o.Script("get_book",
	   		WithArg("bookTitle", "Nineteen eighty-four"),
	   	).Print()
	   	o.Script("get_books_by_genre",
	   		WithArg("genre", "Dystopian"),
	   	).Print()
	   	o.Script("get_genres").Print()
	   	o.Script("get_books_by_author",
	   		WithArg("author", "George Orwell"),
	   	).Print() */
	// Add a chapter title to a book
	o.Tx("Admin/add_chapter_name",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Nineteen eighty-four"),
		WithArg("chapterTitle", "Chapter 12"),
	).Print()

	// Add a chapter to a book
	o.Tx("Admin/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Nineteen eighty-four"),
		WithArg("chapterTitle", "Chapter 12"),
		WithArg("index", 12),
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

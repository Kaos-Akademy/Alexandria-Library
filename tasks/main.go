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
	paragraphs1, err := ReadFile("books/Animal_Farm_Chapter_X.txt")
	if err != nil {
		fmt.Printf("Error reading Animal Farm chapter X file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully loaded %d paragraphs from Animal Farm chapter X\n", len(paragraphs1))

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
		WithArg("title", "Animal Farm"),
		WithArg("author", "George Orwell"),
		WithArg("genre", "Dystopian"),
		WithArg("edition", "First Edition"),
		WithArg("summary", "Animal Farm by George Orwell (1945) is a satirical fable about the corrupting influence of power and the betrayal of idealism. Set on a farm where animals rebel against human oppression, the story explores themes of revolution, leadership, and the eventual return to tyranny. Through vivid characters and allegorical storytelling, it critiques totalitarianism and questions the motives of those who seek power."),
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
		WithArg("bookTitle", "Animal Farm"),
		WithArg("chapterTitle", "Chapter X"),
	).Print()

	// Add a chapter to a book
	o.Tx("Admin/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Animal Farm"),
		WithArg("chapterTitle", "Chapter X"),
		WithArg("index", 10),
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

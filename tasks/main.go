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
	paragraphs1, err := ReadFile("books/flow.content.5.txt")
	if err != nil {
		fmt.Printf("Error reading flow whitepaper file: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Successfully loaded %d paragraphs from flow whitepaper\n", len(paragraphs1))

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
		WithArg("title", "Flow: Separating Consensus and Compute"),
		WithArg("author", "Alexander Hentschel, Maor Zamski, Dieter Shirley, Layne Lafrance"),
		WithArg("genre", "Cryptography"),
		WithArg("edition", "First Edition"),
		WithArg("summary", "In this paper, we refine the architecture such that result verification is distributed and parallelized across many Verification Nodes. The full architecture significantly increases throughputand delegates the computation work to the specialized Execution Nodes and the onus of checking it to a variety of less powerful Verification Nodes."),
	).Print() */
	/* 	o.Script("get_book",
	   		WithArg("bookTitle", "Flow: Separating Consensus and Compute"),
	   	).Print()
	   	o.Script("get_books_by_genre",
	   		WithArg("genre", "Cryptography"),
	   	).Print()
	   	o.Script("get_genres").Print()
	   	o.Script("get_books_by_author",
	   		WithArg("author", "Alexander Hentschel, Maor Zamski, Dieter Shirley, Layne Lafrance"),
	   	).Print() */
	// Add a chapter title to a book
	o.Tx("Admin/add_chapter_name",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Flow: Separating Consensus and Compute"),
		WithArg("chapterTitle", "Acknowledgments"),
	).Print()
	// Add a chapter to a book
	o.Tx("Admin/add_chapter",
		WithSigner("Prime-librarian"),
		WithArg("bookTitle", "Flow: Separating Consensus and Compute"),
		WithArg("chapterTitle", "Acknowledgments"),
		WithArg("index", 5),
		WithArg("paragraphs", paragraphs1),
	).Print()
	o.Script("get_books_by_author",
		WithArg("author", "Alexander Hentschel, Maor Zamski, Dieter Shirley, Layne Lafrance"),
	).Print()
	/* 	o.Script("get_book",
	   		WithArg("bookTitle", "Flow: Separating Consensus and Compute"),
	   	).Print()
	   	o.Script("get_book_chapter",
	   		WithArg("bookTitle", "Flow: Separating Consensus and Compute"),
	   		WithArg("chapterTitle", "Flow Architecture"),
	   	).Print() */

}

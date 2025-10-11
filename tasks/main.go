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

	// Specify the path to your JavaScript file
	/* 	filePath := "books/chapters/I.js"
	   	filePath2 := "books/chapters/II.js"
	   	filePath3 := "books/chapters/III.js"
	   	filePath4 := "books/chapters/IV.js"
	   	filePath5 := "books/chapters/V.js"
	   	filePath6 := "books/chapters/VI.js"
	   	filePath7 := "books/chapters/VII.js"
	   	filePath8 := "books/chapters/VIII.js"
	   	filePath9 := "books/chapters/IX.js"
	   	filePath10 := "books/chapters/X.js"
	   	filePath11 := "books/chapters/XI.js"
	   	filePath12 := "books/chapters/XII.js"
	   	filePath13 := "books/chapters/XIII.js"
	   	filePath14 := "books/chapters/XIV.js"
	   	filePath15 := "books/chapters/XV.js"
	   	filePath16 := "books/chapters/XVI.js" */

	/* 	paragraphs1, err := ReadFile(filePath)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs2, err := ReadFile(filePath2)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs3, err := ReadFile(filePath3)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs4, err := ReadFile(filePath4)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs5, err := ReadFile(filePath5)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs6, err := ReadFile(filePath6)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs7, err := ReadFile(filePath7)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs8, err := ReadFile(filePath8)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs9, err := ReadFile(filePath9)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs10, err := ReadFile(filePath10)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs11, err := ReadFile(filePath11)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs12, err := ReadFile(filePath12)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs13, err := ReadFile(filePath13)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs14, err := ReadFile(filePath14)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs15, err := ReadFile(filePath15)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	}

	   	paragraphs16, err := ReadFile(filePath16)
	   	if err != nil {
	   		fmt.Println("Error:", err)
	   		return
	   	} */

	/* 	fmt.Println("Paragraphs:")
	   	for i, paragraph := range paragraphs1 {
	   		fmt.Printf("Paragraph %d: %s\n", i+1, paragraph)
	   	} */

	// Now you have the JavaScript content as a string (jsContent)
	// fmt.Println(strings.Split(jsContent, "/n"))
	// You can pass jsContent to a function or use it as needed in your Go code

	o := Overflow(
		WithGlobalPrintOptions(),
		WithNetwork("mainnet"),
	)

	fmt.Println("Testing Contract")
	fmt.Println("Press any key to continue")
	fmt.Scanln()

	color.Red("Posterity Contract testing")

	color.Red("")

	// o.Script("get_book_titles")

	// Add a book
	/* 	o.Tx("Admin/add_book",
	   		WithSigner("biblio"),
	   		WithArg("title", "The Awakening"),
	   		WithArg("author", "Kate Chopin"),
	   		WithArg("genre", "Feminist Literature"),
	   		WithArg("edition", "First Edition"),
	   		WithArg("summary", "Kate Chopin’s novel, The Awakening, published in 1899, tells the story of Edna Pontellier, a married woman who longs for independence and self-discovery. Set in 19th-century New Orleans, the novel explores themes of identity, autonomy, and the limitations imposed on women during that era."),
	   	).Print()
	   	o.Script("get_book",
	   		WithArg("bookTitle", "The Awakening"),
	   	).Print()
	   	o.Script("get_books_by_genre",
	   		WithArg("genre", "History"),
	   	).Print()
	   	o.Script("get_genres").Print()
	   	o.Script("get_books_by_author",
	   		WithArg("author", "Kate Chopin"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "I"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "II"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "III"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "IV"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "V"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VI"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VII"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VIII"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "IX"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "X"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XI"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XII"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XIII"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XIV"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XV"),
	   	).Print()
	   	// Add a chapter title to a book
	   	o.Tx("Admin/add_chapter_name",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XVI"),
	   	).Print()

	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "I"),
	   		WithArg("index", 1),
	   		WithArg("paragraphs", paragraphs1),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "II"),
	   		WithArg("index", 2),
	   		WithArg("paragraphs", paragraphs2),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "III"),
	   		WithArg("index", 3),
	   		WithArg("paragraphs", paragraphs3),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "IV"),
	   		WithArg("index", 4),
	   		WithArg("paragraphs", paragraphs4),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "V"),
	   		WithArg("index", 5),
	   		WithArg("paragraphs", paragraphs5),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VI"),
	   		WithArg("index", 6),
	   		WithArg("paragraphs", paragraphs6),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VII"),
	   		WithArg("index", 7),
	   		WithArg("paragraphs", paragraphs7),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "VIII"),
	   		WithArg("index", 8),
	   		WithArg("paragraphs", paragraphs8),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "IX"),
	   		WithArg("index", 9),
	   		WithArg("paragraphs", paragraphs9),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "X"),
	   		WithArg("index", 10),
	   		WithArg("paragraphs", paragraphs10),
	   	).Print()
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "X"),
	   		WithArg("index", 11),
	   		WithArg("paragraphs", paragraphs11),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XII"),
	   		WithArg("index", 12),
	   		WithArg("paragraphs", paragraphs12),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XIII"),
	   		WithArg("index", 13),
	   		WithArg("paragraphs", paragraphs13),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XIV"),
	   		WithArg("index", 14),
	   		WithArg("paragraphs", paragraphs14),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XV"),
	   		WithArg("index", 15),
	   		WithArg("paragraphs", paragraphs15),
	   	).Print()
	   	// Add a chapter to a book
	   	o.Tx("Admin/add_chapter",
	   		WithSigner("biblio"),
	   		WithArg("bookTitle", "The Awakening"),
	   		WithArg("chapterTitle", "XVI"),
	   		WithArg("index", 16),
	   		WithArg("paragraphs", paragraphs16),
	   	).Print()
	   	o.Script("get_books_by_author",
	   		WithArg("author", "Kate Chopin"),
	   	).Print()
	   	o.Script("get_book",
	   		WithArg("bookTitle", "The Awakening"),
	   	).Print() */
	o.Script("get_book_chapter",
		WithArg("bookTitle", "The Awakening"),
		WithArg("chapterTitle", "I"),
	).Print()

}

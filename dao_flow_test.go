package main

import (
	"fmt"
	"testing"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// Full cover test suite for the whole app Flow

func TestFullFlow(t *testing.T) {
	o, err := OverflowTesting()
	require.NoError(t, err)
	require.NotNil(t, o)
	assert.NoError(t, err)

	color.White("STARTING Alexandria DAO FLOW TEST")
	color.Green("GREEN transactions are meant to SUCCEED")
	color.Red("Red transactions are meant to FAIL")
	// Someone makes a donation to the DAO
	color.Green("Bob makes donation to the DAO")
	o.Tx("DAO/donate",
		WithSigner("bob"),
		WithArg("amount", "100.0"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Bob should now have a Founder Soul-bound NFT

	color.Green("Bob should now have a Founder Soul-bound NFT")
	o.Script("DAO/get_founder_nft",
		WithSigner("bob"),
	).Print()
	// Alice makes a donation to the DAO
	color.Green("Alice makes donation to the DAO")
	o.Tx("DAO/donate",
		WithSigner("alice"),
		WithArg("amount", "100.0"),
	).AssertSuccess(t).Print()
	color.Green("")

	// Founder NFT should tell me how much Flow has Bob donated
	color.Green("Founder NFT should tell me how much Flow has Alice donated")
	o.Script("DAO/get_founder_nft",
		WithSigner("alice"),
	).Print()
	// Bob should not be able to tranfer his NFT to Alice
	color.Green("Bob should not be able to transfer his NFT to Alice")
	o.Tx("DAO/transfer_founder_nft",
		WithSigner("bob"),
		WithArg("to", "alice"),
	).AssertFailure(t, "These NFTs are Soul-Bound and cannot be transferred").Print()
	color.Red("")
	// Bob donates a second time to the DAO
	color.Green("Bob donates a second time to the DAO")
	o.Tx("DAO/donate",
		WithSigner("bob"),
		WithArg("amount", "200.0"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Founder NFT should tell me how much Flow has Bob donated
	color.Green("Founder NFT should tell me how much Flow has Bob donated")
	o.Script("DAO/get_founder_nft",
		WithSigner("bob"),
	).Print()
	// Bob will now create a new Topic, which should cost him 1 FLOW
	color.Green("Bob will now create a new Topic, which should cost him 1 FLOW")
	o.Tx("DAO/create_topic",
		WithSigner("bob"),
		WithArg("title", "Test Topic"),
		WithArg("description", "This is a test topic"),
		WithArg("minimumVotes", "1"),
		WithArg("options", "Test Option"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Alice will now vote on the Topic
	color.Green("Alice will now vote on the Topic")
	o.Tx("DAO/vote",
		WithSigner("alice"),
		WithArg("option", "Test Option"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Get all the votes for the Topic
	color.Green("Get all the votes for the Topic")
	o.Script("DAO/get_votes",
		WithSigner("bob"),
		WithArg("topicID", "1"),
	).Print()
	color.Green("")
	// Alice will now vote on the Topic
	color.Green("Alice will now vote on the Topic")
	o.Tx("DAO/vote",
		WithSigner("alice"),
		WithArg("option", "Test Option"),
	).AssertSuccess(t).Print()
	color.Green("")
	// The DAO should determine the results itself after the voting period ends
	color.Green("The DAO should determine the results itself after the voting period ends")
	o.Script("DAO/get_topic_results").Print()
	color.Green("")

	fmt.Println("artist id ")
}

// Basic flow test for the standalone Donations_Alexandria contract
func TestDonationsFlow(t *testing.T) {
	o, err := OverflowTesting()
	require.NoError(t, err)
	require.NotNil(t, o)
	assert.NoError(t, err)

	color.White("STARTING Donations FLOW TEST")
	color.Green("GREEN transactions are meant to SUCCEED")
	// Add a book to the Library
	color.Green("Add a book to the Library")
	o.Tx("Admin/add_book",
		WithSigner("account"),
		WithArg("title", "Test Book"),
		WithArg("author", "Test Author"),
		WithArg("genre", "Test Genre"),
		WithArg("edition", "Test Edition"),
		WithArg("summary", "Test Summary"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Add a chapter name to the book
	color.Green("Add a chapter name to the book")
	o.Tx("Admin/add_chapter_name",
		WithSigner("account"),
		WithArg("bookTitle", "Test Book"),
		WithArg("chapterTitle", "Test Chapter"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Add a chapter to the book
	color.Green("Add a chapter to the book")
	o.Tx("Admin/add_chapter",
		WithSigner("account"),
		WithArg("bookTitle", "Test Book"),
		WithArg("chapterTitle", "Test Chapter"),
		WithArg("index", 0),
		WithArg("paragraphs", `["Test Paragraph", "Test Paragraph 2"]`),
	).AssertSuccess(t).Print()
	color.Green("")
	// Get all the books in the Library
	color.Green("Get all the books in the Library")
	o.Script("get_books").Print()
	color.Green("")

	// Bob makes a donation to the Donations_Alexandria contract
	color.Green("Bob makes a donation to Donations_Alexandria")
	o.Tx("donations/donate",
		WithSigner("bob"),
		WithArg("amount", "3.0"),
	).AssertSuccess(t).Print()
	color.Green("")

	// Bob donates a second time
	color.Green("Bob donates a second time to Donations_Alexandria")
	o.Tx("donations/donate",
		WithSigner("bob"),
		WithArg("amount", "5.0"),
	).AssertSuccess(t).Print()
	color.Green("")

	// Alice makes a donation
	color.Green("Alice makes a donation to Donations_Alexandria")
	o.Tx("donations/donate",
		WithSigner("alice"),
		WithArg("amount", "7.0"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Add a keeper to the book
	color.Green("Add a keeper to the book")
	o.Tx("account/add_keeper",
		WithSigner("account"),
		WithArg("bookTitle", "Test Book"),
		WithArg("keeper", "bob"),
	).AssertSuccess(t).Print()
	color.Green("")
	// Get the keeper of the book
	color.Green("Get the keeper of the book")
	o.Script("get_book_keeper",
		WithArg("bookTitle", "Test Book"),
	).Print()
	color.Green("")
}

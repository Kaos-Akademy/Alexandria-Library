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

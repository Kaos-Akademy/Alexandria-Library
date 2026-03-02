package main

import (
	"testing"

	. "github.com/bjartek/overflow/v2"
	"github.com/fatih/color"
	"github.com/stretchr/testify/require"
)

// EntryKind raw values: MEMORY=0, CONVERSATION=1, REFERENCE=2, NOTE=3
const (
	entryKindMemory       = "memory"
	entryKindConversation = "conversation"
	entryKindReference    = "reference"
	entryKindNote         = "note"
)

// TestLibrarianFlow tests the Librarian contract, its transactions and scripts.
// Requires: Librarian contract deployed to "account" (0x01), flow.json with contracts/accounts/deployments.
func TestLibrarianFlow(t *testing.T) {
	o, err := OverflowTesting()
	require.NoError(t, err)
	require.NotNil(t, o)

	color.White("STARTING Librarian FLOW TEST")
	color.Green("GREEN transactions are meant to SUCCEED")
	color.Red("Red transactions are meant to FAIL")

	// Contract init creates identity; setup_identity publishes capability for get_librarian_journal
	// (init saves to storage but does not publish; setup_identity overwrites and publishes)

	// Set the Librarian's name (one-time, must succeed)
	color.Green("Librarian sets name to 'AI Librarian'")
	o.Tx("librarian/set_name",
		WithSigner("account"),
		WithArg("newName", "Zen"),
	).AssertSuccess(t).Print()
	color.Green("")

	// Record a MEMORY entry
	color.Green("Record MEMORY entry")
	o.Tx("librarian/record_entry",
		WithSigner("account"),
		WithArg("entryType", entryKindMemory),
		WithArg("content", "User prefers philosophy books"),
		WithArg("metadata", `{"source": "chat"}`),
	).AssertSuccess(t).Print()
	color.Green("")

	// Record a CONVERSATION entry
	color.Green("Record CONVERSATION entry")
	o.Tx("librarian/record_entry",
		WithSigner("account"),
		WithArg("entryType", entryKindConversation),
		WithArg("content", "Discussed Nietzsche's Ecce Homo"),
		WithArg("metadata", `{"bookTitle": "Ecce Homo"}`),
	).AssertSuccess(t).Print()
	color.Green("")

	// Record a REFERENCE entry
	color.Green("Record REFERENCE entry")
	o.Tx("librarian/record_entry",
		WithSigner("account"),
		WithArg("entryType", entryKindReference),
		WithArg("content", "Referenced chapter 1 of Ecce Homo"),
		WithArg("metadata", `{"bookTitle": "Ecce Homo", "chapter": "1"}`),
	).AssertSuccess(t).Print()
	color.Green("")

	// Record a NOTE entry
	color.Green("Record NOTE entry")
	o.Tx("librarian/record_entry",
		WithSigner("account"),
		WithArg("entryType", entryKindNote),
		WithArg("content", "Internal note for future reference"),
		WithArg("metadata", `{}`),
	).AssertSuccess(t).Print()
	color.Green("")

	// Get journal entries (script - needs librarian account address)
	// Pass account name; overflow resolves to Address when in flow.json accounts
	color.Green("Get Librarian journal (last 5 entries)")
	o.Script("get_librarian_journal",
		WithArg("limit", 5),
	).Print()
	color.Green("")

	// Name can only be set once - second attempt should fail
	color.Red("Librarian tries to set name again (should FAIL)")
	o.Tx("librarian/set_name",
		WithSigner("account"),
		WithArg("newName", "Another Name"),
	).AssertFailure(t, "Name has already been set").Print()
	color.Red("")
}

// TestLibrarianSetupIdentity tests the setup_identity transaction (optional - used when identity not in init)
func TestLibrarianSetupIdentity(t *testing.T) {
	o, err := OverflowTesting()
	require.NoError(t, err)
	require.NotNil(t, o)

	color.White("STARTING Librarian Setup Identity TEST")
	// setup_identity creates LibrarianIdentity and publishes capability
	// Note: If contract init already creates identity, this may overwrite
	color.Green("Run setup_identity (creates identity if missing, publishes capability)")
	o.Tx("librarian/setup_identity",
		WithSigner("account"),
	).AssertSuccess(t).Print()
	color.Green("")
}

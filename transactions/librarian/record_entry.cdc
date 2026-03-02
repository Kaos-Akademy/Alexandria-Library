// Record a journal entry. Executable ONLY by the Librarian account.
// Replace LIBRARIAN_ADDRESS with the Librarian contract account address.
// entryType must be one of: Librarian.EntryKind.memory, .conversation, .reference, .note
import "Librarian"

transaction(entryType: String, content: String, metadata: {String: String}) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&Librarian.LibrarianIdentity>(from: Librarian.LibrarianStoragePath)
            ?? panic("No LibrarianIdentity found")
        // create enum entry depending on the string
        if entryType == "memory" {
        identity.recordEntry(entryType: Librarian.EntryKind.MEMORY, content: content, metadata: metadata)
        } else if entryType == "conversation" {
            identity.recordEntry(entryType: Librarian.EntryKind.CONVERSATION, content: content, metadata: metadata)
        } else if entryType == "reference" {
            identity.recordEntry(entryType: Librarian.EntryKind.REFERENCE, content: content, metadata: metadata)
        } else if entryType == "note" {
            identity.recordEntry(entryType: Librarian.EntryKind.NOTE, content: content, metadata: metadata)
        } else {
            panic("Invalid entry type")
        }
        

    }
}
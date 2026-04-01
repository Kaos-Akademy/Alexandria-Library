/**
 * Returns the Cadence transaction code for recording a journal entry.
 * entryType must be one of: memory, conversation, reference, note
 */
export const recordEntry = (LibrarianContractAddress: string) => {
  return `
import Librarian from ${LibrarianContractAddress}

transaction(entryType: String, content: String, metadata: {String: String}) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&Librarian.LibrarianIdentity>(from: Librarian.LibrarianStoragePath)
            ?? panic("No LibrarianIdentity found")
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
`
}

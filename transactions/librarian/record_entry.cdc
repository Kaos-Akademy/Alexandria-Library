// Record a journal entry. Executable ONLY by the Librarian account.
// Replace LIBRARIAN_ADDRESS with the Librarian contract account address.
import Librarian from 0x0000000000000001

transaction(entryType: String, content: String, metadata: {String: String}) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&Librarian.LibrarianIdentity>(from: Librarian.LibrarianStoragePath)
            ?? panic("No LibrarianIdentity found")
        identity.recordEntry(entryType: entryType, content: content, metadata: metadata)
    }
}

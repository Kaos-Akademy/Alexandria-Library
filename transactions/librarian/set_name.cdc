// One-time self-naming. Executable ONLY by the Librarian account (owner of LibrarianIdentity).
// Replace LIBRARIAN_ADDRESS with the Librarian contract account address.
import Librarian from 0x0000000000000001

transaction(newName: String) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&Librarian.LibrarianIdentity>(from: Librarian.LibrarianStoragePath)
            ?? panic("No LibrarianIdentity found")
        identity.setName(newName: newName)
    }
}

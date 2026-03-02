// One-time setup: create LibrarianIdentity resource and publish public capability.
// Run by the Librarian account (the AI's account) when first deploying.
// Replace LIBRARIAN_ADDRESS with the Librarian contract account address.
import Librarian from 0x0000000000000001

transaction() {
    prepare(signer: auth(Storage, Capabilities) &Account) {
        let identity <- Librarian.createLibrarianIdentity()
        signer.storage.save(<- identity, to: Librarian.LibrarianStoragePath)
        let identityRef = signer.storage.borrow<&Librarian.LibrarianIdentity{Librarian.LibrarianIdentityPublic}>(from: Librarian.LibrarianStoragePath)!
        signer.capabilities.publish(identityRef, at: Librarian.LibrarianPublicPath)
    }
}

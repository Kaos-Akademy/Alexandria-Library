/**
 * One-time self-naming. Submitted as the Librarian account via BLOCKCHAIN_API.
 */
export const setNameTransaction = (LibrarianContractAddress: string) => {
  return `
import Librarian from ${LibrarianContractAddress}

transaction(newName: String) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&Librarian.LibrarianIdentity>(from: Librarian.LibrarianStoragePath)
            ?? panic("No LibrarianIdentity found")
        identity.setName(newName: newName)
    }
}
`
}

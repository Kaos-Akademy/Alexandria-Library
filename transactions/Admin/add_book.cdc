import "Alexandria"

transaction(
    title: String,
    author: String,
    genre: String,
    edition: String,
    summary: String
    ) {
    /// Reference to the withdrawer's collection
    let AdminRef: auth(Alexandria.AdminActions) &Alexandria.Admin

    prepare (deployer: auth(BorrowValue) &Account) {
        let identifier = "Alexandria_Library_\(deployer.address)"
        // borrow a reference to the signer's NFT collection
        self.AdminRef = deployer.storage.borrow<auth(Alexandria.AdminActions) &Alexandria.Admin>(
                from: Alexandria.AdminStoragePath
        )!
        //?? panic("Account does not store an object at the specified path")

    }

  execute {
    self.AdminRef.addBook(title: title, author: author, genre: genre, edition: edition, summary: summary)
  }
}
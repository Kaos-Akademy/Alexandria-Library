import "Alexandria"

transaction(
    bookTitle: String,
    chapterTitle: String,
    ) {
    /// Reference to the withdrawer's collection
    let AdminRef: &Alexandria.Admin

    prepare (deployer: auth(BorrowValue) &Account) {
        // borrow a reference to the signer's NFT collection
        self.AdminRef = deployer.storage.borrow<&Alexandria.Admin>(
                from: Alexandria.AdminStoragePath
        ) ?? panic("Account does not store an object at the specified path")

    }

  execute {
        self.AdminRef.addChapterName(bookTitle: bookTitle, chapterName: chapterTitle)
  }
}
import "Alexandria"

transaction(
    bookTitle: String,
    chapterTitle: String,
    index: Int,
    paragraphs: [String]
    ) {
    /// Reference to the withdrawer's collection
    let librarianRef: &Alexandria.Librarian
    let chapter: Alexandria.Chapter

    prepare (deployer: auth(BorrowValue) &Account) {
        // borrow a reference to the signer's NFT collection
        self.librarianRef = deployer.storage.borrow<&Alexandria.Librarian>(
                from: Alexandria.LibrarianStoragePath
        ) ?? panic("Account does not store an object at the specified path")

        let book = Alexandria.getBook(bookTitle: bookTitle)

        self.chapter = Alexandria.Chapter(bookTitle, chapterTitle, index, paragraphs)
    }

  execute {
        self.librarianRef.submitChapter(bookTitle: bookTitle, chapter: self.chapter)
  }
}
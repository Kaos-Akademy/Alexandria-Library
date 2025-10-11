import "Alexandria"

transaction(
    bookTitle: String,
    chapterTitle: String,
    index: Int,
    paragraphs: [String]
    ) {
    /// Reference to the withdrawer's collection
    let AdminRef: &Alexandria.Admin
    let chapter: Alexandria.Chapter

    prepare (deployer: auth(BorrowValue) &Account) {
        // borrow a reference to the signer's NFT collection
        self.AdminRef = deployer.storage.borrow<&Alexandria.Admin>(
                from: Alexandria.AdminStoragePath
        ) ?? panic("Account does not store an object at the specified path")

        let book = Alexandria.getBook(bookTitle: bookTitle)

        self.chapter = Alexandria.Chapter(bookTitle, chapterTitle, index, paragraphs)
    //    self.oldChaptersLength = book.Chapters.length
        let unused = self.AdminRef.addChapter(bookTitle: bookTitle, chapter: self.chapter)
    }

/*     post {
        self.newChaptersLength > self.oldChaptersLength: "The book's number of chapter did not increase"
    } */
}
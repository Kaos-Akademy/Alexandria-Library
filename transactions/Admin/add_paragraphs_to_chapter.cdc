import "Alexandria"

transaction(
    bookTitle: String,
    chapterTitle: String,
    paragraphs: [String]
    ) {

    prepare (deployer: auth(BorrowValue) &Account) {
        let identifier = "Alexandria_Library_".concat(deployer.address.toString()).concat("_".concat(bookTitle))
        let book = deployer.storage.borrow<auth(Alexandria.LibrarianActions) &Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
        var i = 0
        while i < paragraphs.length {
            let unused = book.addParagraph(chapterTitle: chapterTitle, paragraph: paragraphs[i])
            i = i + 1
        }
    }
}

import "Alexandria"

transaction(
    bookTitle: String,
    chapterTitle: String,
    ) {

    prepare (deployer: auth(BorrowValue) &Account) {

        // create book path identifier based on title
            let identifier = "Alexandria_Library_".concat(deployer.address.toString()).concat("_".concat(bookTitle))
            
            let book = deployer.storage.borrow<auth(BorrowValue) &Alexandria.Book>(from: StoragePath(identifier: identifier)!)!
            let unused = book.removeLastParagraph(chapterTitle: chapterTitle)
    }
} 
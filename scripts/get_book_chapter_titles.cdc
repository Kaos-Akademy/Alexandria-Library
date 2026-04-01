import Alexandria from "../contracts/Alexandria.cdc"

access(all)
fun main(bookTitle: String): [String] {
    let book = Alexandria.getBook(bookTitle: bookTitle)
    if book == nil {
        return []
    }
    return book!.getChapterTitles()
}

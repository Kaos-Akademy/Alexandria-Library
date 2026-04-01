export const getBookAuthor = () => `
import Alexandria from 0xfed1adffd14ea9d0

access(all)
fun main(bookTitle: String): String {
    let book = Alexandria.getBook(bookTitle: bookTitle)
    return book.Author
}
`

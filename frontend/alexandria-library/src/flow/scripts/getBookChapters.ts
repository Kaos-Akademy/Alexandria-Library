export const getBookChapters = () => `
import Alexandria from 0xfed1adffd14ea9d0   

access(all) 
fun main(bookTitle: String): &Alexandria.Book?  {

    return Alexandria.getBook(bookTitle: bookTitle)
} 
`
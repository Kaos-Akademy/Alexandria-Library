import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(bookTitle: String): &Alexandria.Book?  {

    return Alexandria.getBook(bookTitle: bookTitle)
} 
// get_book_keeper.cdc

import "Alexandria"

access(all) 
fun main(bookTitle: String): Address?  {
    return Alexandria.getKeeper(bookTitle: bookTitle)
}   


import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(bookTitle: String): [String]  {

    return Alexandria.getBookChapterTitles(bookTitle: bookTitle)
} 
import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(bookTitle: String, chapterTitle: String): Alexandria.Chapter?  {
    return Alexandria.getBookChapter(bookTitle: bookTitle, chapterTitle: chapterTitle)
} 
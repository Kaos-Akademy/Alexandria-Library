import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(bookTitle: String, chapterTitle: String, paragraphIndex: Int): String  {
    return Alexandria.getBookParagraph(bookTitle: bookTitle, chapterTitle: chapterTitle, paragraphIndex: paragraphIndex)
}   
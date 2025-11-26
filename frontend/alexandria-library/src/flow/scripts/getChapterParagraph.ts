export const getChapterParagraph = () => `
import Alexandria from 0xfed1adffd14ea9d0

access(all) 
fun main(bookTitle: String, chapterTitle: String, paragraphIndex: Int): String  {
    return Alexandria.getBookParagraph(bookTitle: bookTitle, chapterTitle: chapterTitle, paragraphIndex: paragraphIndex)
}   
`
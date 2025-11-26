export const getChapterTitles = () => `
import Alexandria from 0xfed1adffd14ea9d0   

access(all) 
fun main(bookTitle: String): [String]  {

    return Alexandria.getBookChapterTitles(bookTitle: bookTitle)
} 
`
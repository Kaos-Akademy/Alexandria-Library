export const getBookChapterByTitle = () => `
import Alexandria from 0xfed1adffd14ea9d0

access(all)
fun main(bookTitle: String, chapterTitle: String): Alexandria.Chapter? {
    return Alexandria.getBookChapter(bookTitle: bookTitle, chapterTitle: chapterTitle)
}
`

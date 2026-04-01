import Alexandria from "../contracts/Alexandria.cdc"

access(all)
fun main(bookTitle: String, chapterTitle: String): {String: Int}? {
    let chapter = Alexandria.getBookChapter(bookTitle: bookTitle, chapterTitle: chapterTitle)
    if chapter == nil {
        return nil
    }
    return {"index": chapter!.index, "paragraphCount": chapter!.paragraphs.length}
}

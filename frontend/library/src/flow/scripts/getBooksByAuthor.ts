export const getBooksByAuthor = () => `
import Alexandria from 0xfed1adffd14ea9d0

access(all) 
fun main(author: String): [String]?  {
    return Alexandria.getAuthor(author: author)
}
`


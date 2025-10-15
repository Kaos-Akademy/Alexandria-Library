export const getBooksByGenre = () => `
import Alexandria from 0xfed1adffd14ea9d0

access(all) 
fun main(genre: String): [String]?  {
    return Alexandria.getGenre(genre: genre)
} 
`
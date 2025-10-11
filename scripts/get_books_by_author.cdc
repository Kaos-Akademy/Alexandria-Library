import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(author: String): [String]?  {
    return Alexandria.getAuthor(author: author)
} 
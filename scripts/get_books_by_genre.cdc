import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(genre: String): [String]?  {
    return Alexandria.getGenre(genre: genre)
} 
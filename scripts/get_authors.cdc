import Alexandria from "../contracts/Alexandria.cdc"

access(all) 
fun main(): [String]?  {
    return Alexandria.getAuthors()
} 
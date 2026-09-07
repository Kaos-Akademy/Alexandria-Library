import Alexandria from "../contracts/Alexandria.cdc"

/// Returns, in order, whether each title has a Book resource registered in the library catalog.
access(all)
fun main(bookTitles: [String]): [Bool] {
    return Alexandria.hasBooksBatch(titles: bookTitles)
}

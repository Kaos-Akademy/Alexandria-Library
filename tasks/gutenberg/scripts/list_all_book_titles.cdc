import Alexandria from 0xfed1adffd14ea9d0

/// Returns every book title currently registered in the library catalog.
access(all)
fun main(): [String] {
    return Alexandria.getAllBookTitles()
}

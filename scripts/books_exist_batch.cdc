import Alexandria from "../contracts/Alexandria.cdc"

/// Returns, in order, whether each title has a Book resource in Alexandria contract storage.
/// Avoids Alexandria.getBook (which panics when missing) so batch checks stay valid.
access(all)
fun main(bookTitles: [String]): [Bool] {
    var out: [Bool] = []
    for title in bookTitles {
        let identifier = "Alexandria_Library_\(Alexandria.account.address)_\(title)"
        let path = StoragePath(identifier: identifier)!
        let ref = Alexandria.account.storage.borrow<&Alexandria.Book>(from: path)
        out.append(ref != nil)
    }
    return out
}

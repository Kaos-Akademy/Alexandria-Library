import Alexandria from "../contracts/Alexandria.cdc"

/// Returns, in order, whether each title has a Book resource registered in the library catalog.
/// Uses genre indexes (public API) instead of direct contract storage access.
access(all)
fun main(bookTitles: [String]): [Bool] {
    let titleSet = buildTitleSet()
    var out: [Bool] = []
    for title in bookTitles {
        out.append(titleSet[title] != nil)
    }
    return out
}

access(all) fun buildTitleSet(): {String: Bool} {
    let genres = Alexandria.getAllGenres()
    var set: {String: Bool} = {}
    for g in genres {
        if let books = Alexandria.getGenre(genre: g) {
            for t in books {
                set[t] = true
            }
        }
    }
    return set
}

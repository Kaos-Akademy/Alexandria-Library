import Alexandria from 0xfed1adffd14ea9d0

/// Returns every book title currently registered under any genre on-chain.
access(all)
fun main(): [String] {
    let genres = Alexandria.getAllGenres()
    var all: [String] = []
    for g in genres {
        if let books = Alexandria.getGenre(genre: g) {
            for t in books {
                all.append(t)
            }
        }
    }
    return all
}

// Returns the Librarian's name and journal entries.
// Replace LIBRARIAN_ADDRESS with the Librarian account address when running.
import "Librarian"

access(all) fun main(limit: Int): [Librarian.JournalEntry] {
    let entries = Librarian.getLibrarianIdentity(limit: limit)
    return entries
}

// Name, mission statement, and journal in one read (getLibrarianIdentity on the contract).
import "Librarian"

access(all) fun main(limit: Int): Librarian.LibrarianContext {
    return Librarian.getLibrarianIdentity(limit: limit)
}

// Returns the Librarian's name and journal entries.
// Replace LIBRARIAN_ADDRESS with the Librarian account address when running.
import Librarian from 0x0000000000000001

access(all) fun main(librarianAccountAddress: Address, limit: Int): {String: AnyStruct}? {
    let capability = getAccount(librarianAccountAddress).capabilities
        .get<&Librarian.LibrarianIdentity{Librarian.LibrarianIdentityPublic}>(Librarian.LibrarianPublicPath)
    let identity = capability?.borrow()
    if identity == nil {
        return nil
    }
    return {
        "name": identity!.name,
        "createdAt": identity!.createdAt,
        "entries": identity!.getEntries(limit: limit)
    }
}

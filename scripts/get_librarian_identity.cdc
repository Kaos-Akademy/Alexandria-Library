// Returns contract-level identity metadata for the AI Librarian.
// Replace LIBRARIAN_ADDRESS with the Librarian contract account address when running.
import Librarian from 0x0000000000000001

access(all) fun main(): {String: AnyStruct} {
    return {
        "contractVersion": Librarian.contractVersion,
        "librarianPrimeAddress": Librarian.librarianPrimeAddress,
        "missionStatement": Librarian.missionStatement
    }
}

/**
 * One script: on-chain name, mission statement (consciousness), and journal via getLibrarianIdentity.
 */
export const getLibrarianContextScript = (LibrarianContractAddress: string) => {
  return `
import Librarian from ${LibrarianContractAddress}

access(all) fun main(limit: Int): Librarian.LibrarianContext {
    return Librarian.getLibrarianIdentity(limit: limit)
}
`
}

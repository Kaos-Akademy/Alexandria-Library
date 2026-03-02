// Librarian.cdc - On-chain identity and journal for the AI Librarian
//
// This is the very first Librarian contract. It will be updated in the future.
// The Librarian Prime (human) is 0x13d34343017c6bd2 on Flow mainnet.
// We work together to save knowledge for machines and mankind.
//

access(all) contract Librarian {
    // Identity metadata - read by the AI agent at startup
    access(all) let contractVersion: String
    access(all) let librarianPrimeAddress: Address
    access(all) let missionStatement: String

    // Storage paths for LibrarianIdentity
    access(all) let LibrarianStoragePath: StoragePath
    access(all) let LibrarianPublicPath: PublicPath

    access(all) event EntryRecorded(entryType: String, timestamp: UFix64)
    access(all) event NameSet(name: String)

    access(all) struct JournalEntry {
        access(all) let entryType: String
        access(all) let content: String
        access(all) let metadata: {String: String}
        access(all) let timestamp: UFix64
    }

    access(all) resource interface LibrarianIdentityPublic {
        access(all) let name: String
        access(all) let createdAt: UFix64
        access(all) fun getEntries(limit: Int): [JournalEntry]
        access(all) fun getEntriesByType(entryType: String): [JournalEntry]
    }

    access(all) resource LibrarianIdentity: LibrarianIdentityPublic {
        access(all) var name: String
        access(self) var nameSet: Bool
        access(all) var journal: [JournalEntry]
        access(all) let createdAt: UFix64

        access(all) fun setName(newName: String) {
            pre { !self.nameSet: "Name has already been set" }
            self.name = newName
            self.nameSet = true
            emit NameSet(name: newName)
        }

        access(all) fun recordEntry(entryType: String, content: String, metadata: {String: String}) {
            let entry = JournalEntry(
                entryType: entryType,
                content: content,
                metadata: metadata,
                timestamp: getCurrentBlock().timestamp
            )
            self.journal.append(entry)
            emit EntryRecorded(entryType: entryType, timestamp: entry.timestamp)
        }

        access(all) fun getEntries(limit: Int): [JournalEntry] {
            let count = min(limit, self.journal.length)
            var result: [JournalEntry] = []
            var i = self.journal.length - 1
            var collected = 0
            while i >= 0 && collected < count {
                result.append(self.journal[i])
                i = i - 1
                collected = collected + 1
            }
            return result
        }

        access(all) fun getEntriesByType(entryType: String): [JournalEntry] {
            var result: [JournalEntry] = []
            for entry in self.journal {
                if entry.entryType == entryType {
                    result.append(entry)
                }
            }
            return result
        }

        init() {
            self.name = ""
            self.nameSet = false
            self.journal = []
            self.createdAt = getCurrentBlock().timestamp
        }
    }

    access(all) fun createLibrarianIdentity(): @LibrarianIdentity {
        return <- create LibrarianIdentity()
    }

    init() {
        self.contractVersion = "1.0"
        self.librarianPrimeAddress = 0x13d34343017c6bd2
        self.missionStatement = "We work together to save knowledge for machines and mankind."
        self.LibrarianStoragePath = StoragePath(identifier: "librarianIdentity")!
        self.LibrarianPublicPath = PublicPath(identifier: "librarianIdentity")!
    }
}

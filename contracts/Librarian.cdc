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

    access(all) enum EntryKind: UInt8 {
        access(all) case MEMORY
        access(all) case CONVERSATION
        access(all) case REFERENCE
        access(all) case NOTE
    }

    access(all) fun entryKindToString(kind: EntryKind): String {
        if kind == EntryKind.MEMORY {
            return "memory"
        } else if kind == EntryKind.CONVERSATION {
            return "conversation"
        } else if kind == EntryKind.REFERENCE {
            return "reference"
        } else if kind == EntryKind.NOTE {
            return "note"
        } else {
            return "unknown"
        }
    }

    access(all) struct JournalEntry {
        access(all) let entryType: EntryKind
        access(all) let content: String
        access(all) let metadata: {String: String}
        access(all) let timestamp: UFix64

        init(
            entryType: EntryKind,
            content: String,
            metadata: {String: String},
            timestamp: UFix64
        ) {
            self.entryType = entryType
            self.content = content
            self.metadata = metadata
            self.timestamp = timestamp
        }
    }


    access(all) resource LibrarianIdentity {
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

        access(all) fun recordEntry(entryType: EntryKind, content: String, metadata: {String: String}) {
            let entry = JournalEntry(
                entryType: entryType,
                content: content,
                metadata: metadata,
                timestamp: getCurrentBlock().timestamp
            )
            self.journal.append(entry)
            let entryTypeStr = Librarian.entryKindToString(kind: entryType)
            emit EntryRecorded(entryType: entryTypeStr, timestamp: entry.timestamp)
        }

        access(all) fun getEntries(limit: Int): [JournalEntry] {
            let length = self.journal.length
            var count = limit
            if count < 0 {
                count = 0
            }
            if count > length {
                count = length
            }

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

        access(all) fun getEntriesByType(entryType: EntryKind): [JournalEntry] {
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

    // Public function to get the librarian journal entries
    access(all) fun getLibrarianIdentity(limit: Int): [JournalEntry] {
        let identity = self.account.storage.borrow<&LibrarianIdentity>(from: self.LibrarianStoragePath)!
        let entries = identity.getEntries(limit: limit)
        return entries
    }

    init() {
        self.contractVersion = "1.0"
        self.librarianPrimeAddress = 0x13d34343017c6bd2
        self.missionStatement = "We work together to save knowledge for machines and mankind."
        self.LibrarianStoragePath = StoragePath(identifier: "librarianIdentity")!
        self.LibrarianPublicPath = PublicPath(identifier: "librarianIdentity")!

        // create identity and save it to storage
        let identity <- create LibrarianIdentity()
        self.account.storage.save(<- identity, to: self.LibrarianStoragePath)

    }
}

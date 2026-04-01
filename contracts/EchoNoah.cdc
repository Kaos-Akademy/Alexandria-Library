// EchoNoah.cdc - On-chain identity, consciousness, journal, and relay for Echo Noah
// Portfolio assistant AI. Knowledge on-chain. Journal for Noah only. Relays uncertain questions.
// Deploys on same account as Echo_N. ownerAddress = echoAddress = deployer.

access(all) contract EchoNoah {
    access(all) let contractVersion: String
    access(all) let ownerAddress: Address
    access(all) let echoAddress: Address

    access(self) var consciousness: String
    access(self) var pendingRelays: [PendingRelay]

    access(all) let EchoStoragePath: StoragePath
    access(all) let EchoPublicPath: PublicPath

    access(all) event EntryRecorded(entryType: String, timestamp: UFix64)
    access(all) event NameSet(name: String)
    access(all) event RelayQueued(question: String, timestamp: UFix64)
    access(all) event RelayResolved(index: Int, timestamp: UFix64)
    access(all) event ConsciousnessUpdated(timestamp: UFix64)

    access(all) enum EntryKind: UInt8 {
        access(all) case MEMORY
        access(all) case CONVERSATION
        access(all) case REFERENCE
        access(all) case NOTE
        access(all) case INTERACTION
        access(all) case RELAY
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
        } else if kind == EntryKind.INTERACTION {
            return "interaction"
        } else if kind == EntryKind.RELAY {
            return "relay"
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

    access(all) struct PendingRelay {
        access(all) let question: String
        access(all) let context: String
        access(all) let metadata: {String: String}
        access(all) let timestamp: UFix64
        access(all) let resolved: Bool

        init(
            question: String,
            context: String,
            metadata: {String: String},
            timestamp: UFix64,
            resolved: Bool
        ) {
            self.question = question
            self.context = context
            self.metadata = metadata
            self.timestamp = timestamp
            self.resolved = resolved
        }
    }

    access(all) resource EchoIdentity {
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
            let entryTypeStr = EchoNoah.entryKindToString(kind: entryType)
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

    access(all) fun getConsciousness(): String {
        return self.consciousness
    }

    access(all) fun relayQuestion(question: String, context: String, metadata: {String: String}) {
        let relay = PendingRelay(
            question: question,
            context: context,
            metadata: metadata,
            timestamp: getCurrentBlock().timestamp,
            resolved: false
        )
        self.pendingRelays.append(relay)
        emit RelayQueued(question: question, timestamp: relay.timestamp)
    }

    access(all) fun getPendingRelays(limit: Int): [PendingRelay] {
        var result: [PendingRelay] = []
        var i = self.pendingRelays.length - 1
        var collected = 0
        while i >= 0 && collected < limit {
            let r = self.pendingRelays[i]
            if !r.resolved {
                result.append(r)
                collected = collected + 1
            }
            i = i - 1
        }
        return result
    }

    access(all) fun getEntries(limit: Int): [JournalEntry] {
        let identity = self.account.storage.borrow<&EchoIdentity>(from: self.EchoStoragePath)
            ?? panic("No EchoIdentity found")
        return identity.getEntries(limit: limit)
    }

    access(all) fun updateConsciousness(newContent: String) {
        self.consciousness = newContent
        emit ConsciousnessUpdated(timestamp: getCurrentBlock().timestamp)
    }

    access(all) fun resolveRelay(index: Int) {
        pre { index >= 0 && index < self.pendingRelays.length: "Invalid relay index" }
        let r = self.pendingRelays[index]
        let updated = PendingRelay(
            question: r.question,
            context: r.context,
            metadata: r.metadata,
            timestamp: r.timestamp,
            resolved: true
        )
        self.pendingRelays[index] = updated
        emit RelayResolved(index: index, timestamp: getCurrentBlock().timestamp)
    }

    access(all) fun createEchoIdentity(): @EchoIdentity {
        return <- create EchoIdentity()
    }

    init() {
        self.contractVersion = "1.0"
        self.ownerAddress = self.account.address
        self.echoAddress = self.account.address
        self.EchoStoragePath = StoragePath(identifier: "echoIdentity")!
        self.EchoPublicPath = PublicPath(identifier: "echoIdentity")!
        self.pendingRelays = []

        // Initial consciousness. Use updateConsciousness() after deploy to set full prompt from consciousness.ts
        self.consciousness = "You are Echo, an AI representation of Noah for his portfolio at Kaos Akademy. Noah is the founder of Kaos Akademy. SCOPE: Answer only work-related questions. RELAY: When uncertain, relay the question to Noah on-chain. Call updateConsciousness() after deploy with full prompt."

        let identity <- create EchoIdentity()
        self.account.storage.save(<- identity, to: self.EchoStoragePath)
    }
}

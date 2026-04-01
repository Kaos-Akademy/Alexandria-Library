// Record a journal entry. Executable by the Echo account (backend).
// entryType: memory, conversation, reference, note, interaction, relay
import "EchoNoah"

transaction(entryType: String, content: String, metadata: {String: String}) {
    prepare(signer: auth(BorrowValue) &Account) {
        let identity = signer.storage.borrow<&EchoNoah.EchoIdentity>(from: EchoNoah.EchoStoragePath)
            ?? panic("No EchoIdentity found")
        if entryType == "memory" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.MEMORY, content: content, metadata: metadata)
        } else if entryType == "conversation" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.CONVERSATION, content: content, metadata: metadata)
        } else if entryType == "reference" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.REFERENCE, content: content, metadata: metadata)
        } else if entryType == "note" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.NOTE, content: content, metadata: metadata)
        } else if entryType == "interaction" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.INTERACTION, content: content, metadata: metadata)
        } else if entryType == "relay" {
            identity.recordEntry(entryType: EchoNoah.EntryKind.RELAY, content: content, metadata: metadata)
        } else {
            panic("Invalid entry type")
        }
    }
}

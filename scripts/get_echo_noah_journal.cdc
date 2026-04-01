// Returns Echo's journal entries. Backend only - for Noah's dashboard. Never expose in frontend.
import "EchoNoah"

access(all) fun main(limit: Int): [EchoNoah.JournalEntry] {
    return EchoNoah.getEntries(limit: limit)
}

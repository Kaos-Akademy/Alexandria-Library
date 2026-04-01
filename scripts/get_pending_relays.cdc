// Returns unresolved relays for Noah. Backend only - for Noah's dashboard.
import "EchoNoah"

access(all) fun main(limit: Int): [EchoNoah.PendingRelay] {
    return EchoNoah.getPendingRelays(limit: limit)
}

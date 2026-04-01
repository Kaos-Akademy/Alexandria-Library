// Mark a relay as resolved. Signed by owner (Noah) only.
import "EchoNoah"

transaction(index: Int) {
    prepare(signer: auth(BorrowValue) &Account) {
        // Signer must be owner; backend uses Noah's key to sign
    }
    execute {
        EchoNoah.resolveRelay(index: index)
    }
}

// Update Echo's consciousness (AI prompt). Signed by owner (Noah) only.
import "EchoNoah"

transaction(newContent: String) {
    prepare(signer: auth(BorrowValue) &Account) {
        // Signer must be owner; backend uses Noah's key to sign
    }
    execute {
        EchoNoah.updateConsciousness(newContent: newContent)
    }
}

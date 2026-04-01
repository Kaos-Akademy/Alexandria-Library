// Relay a question to Noah when Echo is uncertain. Signed by Echo account (backend).
import "EchoNoah"

transaction(question: String, context: String, metadata: {String: String}) {
    prepare(signer: auth(BorrowValue) &Account) {
        // Signer must be echo account; backend uses echo key to sign
    }
    execute {
        EchoNoah.relayQuestion(question: question, context: context, metadata: metadata)
    }
}

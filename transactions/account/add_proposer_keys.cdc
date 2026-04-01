// add_proposer_keys.cdc
//
// Adds additional proposer-only keys by copying key index 0 with weight 0.0.
// This enables concurrent transaction throughput from one account.
transaction(numKeys: Int) {
    prepare(signer: auth(AddKey) &Account) {
        let baseKey = signer.keys.get(keyIndex: 0)
            ?? panic("Base key at index 0 not found")

        var i = 0
        while i < numKeys {
            let _ = signer.keys.add(
                publicKey: baseKey.publicKey,
                hashAlgorithm: baseKey.hashAlgorithm,
                weight: 0.0
            )
            i = i + 1
        }
    }
}

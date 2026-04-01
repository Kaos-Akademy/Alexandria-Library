export const claimMintCap = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  return `

    import ${MnemeContractName} from ${MnemeContractAddress}

    // This transaction is to claim the mint certificate capability
    // The artist must claim this capability before they can mint a certificate
    // If an old capability exists from a previous contract version, it will be replaced

    transaction(editionId: UInt64) {
        prepare(signer: auth(ClaimInboxCapability, Storage, UnpublishCapability, SaveValue, LoadValue) &Account) {
            // The inbox identifier must match the format used when publishing:
            // contractAddress_ArtDrop_Edition_artistAddress_editionId
            // Format: "\(contractAddress)_ArtDrop_Edition_\(artistAddress)_\(editionId)"
            let inboxIdentifier = ${MnemeContractName}.address.toString()
                .concat("_ArtDrop_Edition_")
                .concat(signer.address.toString())
                .concat("_")
                .concat(editionId.toString())
            let storagePath = StoragePath(identifier: inboxIdentifier)!

            // Check if old capability exists and remove it
            let existingType = signer.storage.type(at: storagePath)
            if existingType != nil {
                // Load (remove) the old capability to make room for the new one
                let oldCap = signer.storage.load<AnyStruct>(from: storagePath)
                // Old capability is now removed
            }

            // Try to claim new capability from inbox
            let cap = signer.inbox.claim<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>(inboxIdentifier, provider: ${MnemeContractName}.address)

            // If capability is in inbox, save it to storage
            if cap != nil {
                signer.storage.save(cap!, to: storagePath)
            } else {
                // No capability in inbox - admin needs to republish it
                panic("⚠️ No capability found in inbox. The contract admin must republish your mint capability with the updated ${MnemeContractName} contract. Please contact the system administrator.")
            }
        }
    }
            `
}

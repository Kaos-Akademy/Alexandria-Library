export const artistEditEditionRules = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  return `

    import ${MnemeContractName} from ${MnemeContractAddress}
    transaction(
        artistAddress: Address,
        editionId: UInt64,
        name: String?,
        price: UFix64?,
        type: String?,
        story: String?,
        dimensions: {String: String}?,
        reprintLimit: Int64?
    ) {
        prepare(signer: auth(BorrowValue) &Account) {
            // The storage identifier must match the format used when saving in claim_mint_cap:
            // contractAddress_ArtDrop_Edition_artistAddress_editionId
            let storageIdentifier = "\\\\(${MnemeContractName}.address)_ArtDrop_Edition_\\\\(artistAddress)_\\\\(editionId)"
            let storagePath = StoragePath(identifier: storageIdentifier)!

            // Borrow edition capability from storage
            // If this fails, the capability needs to be claimed from inbox first
            let capRef = signer.storage.borrow<&Capability<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>>(from: storagePath)
                ?? panic("Could not borrow edition capability. Please claim the capability from your inbox first using claim_mint_cap transaction.")

            // Borrow the actual edition reference from the capability
            let allowed = capRef.borrow()
                ?? panic("Could not borrow capability reference. The capability may be invalid.")

            // Edit the edition with provided parameters
            allowed.editEdition(
                name: name,
                price: price,
                type: type,
                story: story,
                dimensions: dimensions,
                reprintLimit: reprintLimit
            )
        }
    }
          `
}

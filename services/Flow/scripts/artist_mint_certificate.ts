export const mintCertificate = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  // NOTE: This script uses the current contract version (configured via MnemeContractName).
  // If you get a "type mismatch" error, it means the mint capability stored in your account
  // is from an old contract version. Solution: re-claim the capability by calling
  // the /api/blockchain/edition/claim-mint endpoint for this edition.

  return `

        import ${MnemeContractName} from ${MnemeContractAddress}

        transaction(
            artistAddress: Address,
            editionId: UInt64,
            thumbnail: String
        ) {
            prepare(signer: auth(BorrowValue) &Account) {
                // The storage identifier must match the format used when saving in claim_mint_cap:
                // contractAddress_ArtDrop_Edition_artistAddress_editionId
                let storageIdentifier = ${MnemeContractName}.address.toString()
                    .concat("_ArtDrop_Edition_")
                    .concat(artistAddress.toString())
                    .concat("_")
                    .concat(editionId.toString())
                let storagePath = StoragePath(identifier: storageIdentifier)!

                // Borrow mint capability
                // If this fails with "type mismatch", the capability needs to be re-claimed with the current contract version
                let capRef = signer.storage.borrow<&Capability<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>>(from: storagePath)
                    ?? panic("Could not borrow mint capability. Please claim or re-claim the mint capability first.")

                let allowed = capRef.borrow()
                    ?? panic("Could not borrow capability reference.")

                allowed.mintCertificateNFT(thumbnail: thumbnail)
            }
        }

              `
}

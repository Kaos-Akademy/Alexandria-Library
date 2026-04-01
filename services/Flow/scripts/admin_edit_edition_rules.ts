export const editEditionRules = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  return `
    
    import ${MnemeContractName} from ${MnemeContractAddress}
    // This transaction is for the admin to edit the rules of an edition
    // and store it in the Mneme smart contract storage
        transaction(
            editionID: UInt64,
            artistAddress: Address,
            name: String?,
            price: UFix64?,
            type: String?,
            story: String?,
            dimensions: {String: String}?,
            reprintLimit: Int64?) {

            prepare(admin: auth(BorrowValue) &Account) {
                // eslint-disable-next-line quotes
                // prettier-ignore
                let storageIdentifier = ${MnemeContractName}.address.toString().concat("_ArtDrop_Edition_").concat(artistAddress.toString()).concat("_").concat(editionID.toString())
                let storagePath = StoragePath(identifier: storageIdentifier)!
                let editionRef = admin.storage.borrow<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>(from: storagePath)!

                editionRef.editEdition(name: name, price: price, type: type, story: story, dimensions: dimensions, reprintLimit: reprintLimit)
            }
                    
        }
          `
}

export const setupAccount = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  MetadataViewsContractAddress: string | undefined,
  NonFungibleTokenContractAddress: string | undefined,
) => {
  return `

import ${MnemeContractName} from ${MnemeContractAddress}
import NonFungibleToken from ${NonFungibleTokenContractAddress}
import MetadataViews from ${MetadataViewsContractAddress}


transaction() {
    prepare(signer: auth(BorrowValue, IssueStorageCapabilityController, PublishCapability, SaveValue, UnpublishCapability) &Account) {
        
        let collectionData = ${MnemeContractName}.resolveContractView(resourceType: nil, viewType: Type<MetadataViews.NFTCollectionData>()) as! MetadataViews.NFTCollectionData?
            ?? panic("ViewResolver does not resolve NFTCollectionData view")

        // Create a new empty collection
        let collection <- ${MnemeContractName}.createEmptyCollection(nftType: Type<@${MnemeContractName}.CertificateNFT>())
        // save it to the account
        signer.storage.save(<-collection, to: collectionData.storagePath)
        // the old "unlink"
        let oldLink = signer.capabilities.unpublish(collectionData.publicPath)
        // create a public capability for the collection
        let collectionCap = signer.capabilities.storage.issue<&${MnemeContractName}.Collection>(collectionData.storagePath)
        signer.capabilities.publish(collectionCap, at: collectionData.publicPath)
        // Setup the storage

    }
}
      `
}

export const transferCertificate = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  NonFungibleTokenContractAddress: string | undefined,
  MetadataViewsContractAddress: string | undefined,
) => {
  return `
import NonFungibleToken from ${NonFungibleTokenContractAddress}
import MetadataViews from ${MetadataViewsContractAddress}
    import ${MnemeContractName} from ${MnemeContractAddress}

    transaction(to: Address, id: UInt64) {
        // The NFT resource to be transferred
        let tempNFT: @{NonFungibleToken.NFT}

        prepare(signer: auth(BorrowValue) &Account) {
            // borrow a reference to the signer's NFT collection
            let withdrawRef = signer.storage.borrow<auth(NonFungibleToken.Withdraw) &{NonFungibleToken.Collection}>(
                    from: ${MnemeContractName}.CollectionStoragePath
                ) ?? panic("The signer does not store a NFT Collection object at the path ".concat(${MnemeContractName}.CollectionStoragePath.toString())
                            .concat("The signer must initialize their account with this collection first!"))

            self.tempNFT <- withdrawRef.withdraw(withdrawID: id)
        }

        execute {
            // get the recipients public account object
            let recipient = getAccount(to)

            // borrow a public reference to the receivers collection
            let receiverRef = recipient.capabilities.borrow<&{NonFungibleToken.Receiver}>(${MnemeContractName}.CollectionPublicPath)
                ?? panic("The recipient does not have a NonFungibleToken Receiver at ".concat(${MnemeContractName}.CollectionPublicPath.toString()))

            // Deposit the NFT to the receiver
            receiverRef.deposit(token: <-self.tempNFT)
        }
    }
          `
}

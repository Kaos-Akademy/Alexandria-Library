export const withdrawFlow = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  FlowTokenContractAddress: string | undefined,
) => {
  return `
    import ${MnemeContractName} from ${MnemeContractAddress}
    import FlowToken from ${FlowTokenContractAddress}

    transaction() {
        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController) &Account) { 
            // get the collection reference
            let collectionRef: &${MnemeContractName}.Collection = signer.storage.borrow<&${MnemeContractName}.Collection>(from: ${MnemeContractName}.CollectionStoragePath)!
            // get the first ID
            let id = collectionRef.getIDs()[0]
            
            collectionRef.withdrawFromVault(id: id, vaultType: Type<@FlowToken.Vault>())
        }
    }
          `
}

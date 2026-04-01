export const addFlowVaultsToCertificates = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  FungibleTokenContractAddress: string | undefined,
  FlowTokenContractAddress: string | undefined,
) => {
  return `
    import ${MnemeContractName} from ${MnemeContractAddress}
    import FungibleToken from ${FungibleTokenContractAddress}
    import FlowToken from ${FlowTokenContractAddress}

    transaction() {
        let vaultReceiverRef: Capability<&{FungibleToken.Receiver}>

        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController) &Account) { 
            // get the FlowToken Receiver reference Capability
            self.vaultReceiverRef = signer.capabilities.storage.issue<&{FungibleToken.Receiver}>(StoragePath(identifier: "/public/flowTokenReceiver")!)

            // get the collection reference
            let collectionRef: &${MnemeContractName}.Collection = signer.storage.borrow<&${MnemeContractName}.Collection>(from: ${MnemeContractName}.CollectionStoragePath)!
            // get all certificate IDs
            let ids = collectionRef.getIDs()
            // Loop through the IDs and add a new vault to certificates that don't have one yet
            for id in ids {
                // Borrow the certificate to check if it already has a FlowToken vault
                let certificateRef = collectionRef.borrowNFT(id) as! &${MnemeContractName}.CertificateNFT
                let vaultType = Type<@FlowToken.Vault>()
                
                // Only add vault if it doesn't exist yet
                if certificateRef.vaultsDict[vaultType] == nil {
                    // create a new FlowToken Vault
                    let newVault <- FlowToken.createEmptyVault(vaultType: Type<@FlowToken.Vault>())
                    collectionRef.addVault(vaultType: Type<@FlowToken.Vault>(), vault: <- newVault, id: id, vaultReceiverPath: /public/flowTokenReceiver)  
                }
            } 
        }
    }
          `
}

export const adminRepublishMintCap = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
) => {
  return `
        
    import ${MnemeContractName} from ${MnemeContractAddress}
  // This transaction allows the contract admin to republish a mint capability to an artist's inbox
  // This is needed after contract migration (Mneme -> Mneme2) to update artist capabilities
  
        transaction(artistAddress: Address, editionId: UInt64) {
            prepare(admin: auth(Storage, Capabilities, Inbox, IssueStorageCapabilityController) &Account) {
                // Verify admin has access to the edition
                let editionStoragePath = StoragePath(identifier: "MnemeEdition_".concat(editionId.toString()))!
                
                let editionRef = admin.storage.borrow<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>(from: editionStoragePath)
                    ?? panic("❌ Admin does not have access to edition \${editionId}")
                
                // Create a new capability for the artist
                let editionCap = admin.capabilities.storage.issue<auth(${MnemeContractName}.Editions) &${MnemeContractName}.Edition>(editionStoragePath)
                
                // Publish to artist's inbox
                let inboxIdentifier = "ArtDrop_Edition_".concat(artistAddress.toString()).concat("_").concat(editionId.toString())
                admin.inbox.publish(editionCap, name: inboxIdentifier, recipient: artistAddress)
            }
            
            execute {
                log("✅ Mint capability republished to artist ".concat(artistAddress.toString()))
            }
        }
            `
}


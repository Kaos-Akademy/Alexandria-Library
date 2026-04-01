export const getCertificateBalance = (
  NonFungibleTokenContractAddress: string | undefined,
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  FlowTokenContractAddress: string | undefined,
) => {
  return `
    import FlowToken from ${FlowTokenContractAddress}
    import NonFungibleToken from ${NonFungibleTokenContractAddress}
    import ${MnemeContractName} from ${MnemeContractAddress}

    access(all)
    fun main(address: Address, certificateID: UInt64): {String: AnyStruct} {
        let metadata: {String: AnyStruct} = {}

        let account = getAccount(address)

        // Try to borrow the collection capability - handle nil case gracefully
        let collectionRef = account.capabilities.borrow<&${MnemeContractName}.Collection>(${MnemeContractName}.CollectionPublicPath)

        // If collection doesn't exist, return default values
        if collectionRef == nil {
            metadata["balance"] = 0.0
            metadata["vaultExists"] = false
            metadata["collectionExists"] = false
            return metadata
        }

        // Collection exists, try to borrow the NFT
        let nftRef = collectionRef!.borrowNFT(certificateID)

        // If NFT doesn't exist in collection, return default values
        if nftRef == nil {
            metadata["balance"] = 0.0
            metadata["vaultExists"] = false
            metadata["collectionExists"] = true
            metadata["nftExists"] = false
            return metadata
        }

        let certificateRef = nftRef! as! &${MnemeContractName}.CertificateNFT

        // Check if FlowToken vault exists in vaultsDict
        // Based on the contract script: nftRef.vaultsDict[Type<@FlowToken.Vault>()]!.balance
        // We need to check if the vault exists first to avoid panic
        let vaultType = Type<@FlowToken.Vault>()
        if certificateRef.vaultsDict[vaultType] != nil {
            // Vault exists - access balance directly from the resource in the dictionary
            // In Cadence, accessing a resource dictionary returns the resource, allowing direct field access
            metadata["balance"] = certificateRef.vaultsDict[vaultType]!.balance
            metadata["vaultExists"] = true
        } else {
            // Vault doesn't exist
            metadata["balance"] = 0.0
            metadata["vaultExists"] = false
        }

        metadata["collectionExists"] = true
        metadata["nftExists"] = true

        return metadata
    }
  `
}

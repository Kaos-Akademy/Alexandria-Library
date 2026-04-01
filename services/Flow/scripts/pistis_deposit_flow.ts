export const depositFlowToCertificate = (
  MnemeContractAddress: string | undefined,
  MnemeContractName: string | undefined,
  FungibleTokenContractAddress: string | undefined,
  FlowTokenContractAddress: string | undefined,
) => {
  return `
    import ${MnemeContractName} from ${MnemeContractAddress}
    import FungibleToken from ${FungibleTokenContractAddress}
    import FlowToken from ${FlowTokenContractAddress}

    transaction(account: Address, amount: UFix64, id: UInt64) {
        prepare(signer: auth(BorrowValue, IssueStorageCapabilityController) &Account) {
            // Get a reference to the signer's stored vault
            let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
                ?? panic("The signer does not store a FlowToken.Vault object at the path "
                        .concat(/storage/flowTokenVault.toString())
                        .concat(". The signer must initialize their account with this vault first!"))

            // Get the recipient account
            let recipientAccount = getAccount(account)
            
            // Try to borrow the collection capability - handle nil case gracefully
            let collectionRef = recipientAccount.capabilities.borrow<&${MnemeContractName}.Collection>(${MnemeContractName}.CollectionPublicPath)
                ?? panic("The recipient account does not have a Certificate Collection configured. The account must call setupAccount first to initialize the collection before receiving deposits.")
            
            collectionRef.depositToVault(id: id, vaultType: Type<@FlowToken.Vault>(), vaultDeposit: <- vaultRef.withdraw(amount: amount))
        }

        execute {
        }
    }
          `
}

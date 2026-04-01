export const transferFlowTokens = (
  FlowTokenContractAddress: string | undefined,
  FungibleTokenContractAddress: string | undefined,
) => {
  return `
import FungibleToken from ${FungibleTokenContractAddress}
import FlowToken from ${FlowTokenContractAddress}

/// Transfer FLOW tokens from the signer to a recipient
/// 
/// @param amount: The amount of FLOW tokens to transfer (as UFix64)
/// @param to: The recipient's Flow address
///
transaction(amount: UFix64, to: Address) {
    // The Vault resource that holds the tokens being transferred
    let sentVault: @{FungibleToken.Vault}

    prepare(signer: auth(BorrowValue) &Account) {
        // Get a reference to the signer's stored vault
        let vaultRef = signer.storage.borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(
                from: /storage/flowTokenVault
            ) ?? panic("Could not borrow reference to the owner's Vault!")

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Get the recipient's public account object
        let recipient = getAccount(to)

        // Get a reference to the recipient's Receiver
        let receiverRef = recipient.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow receiver reference to the recipient's Vault")

        // Deposit the withdrawn tokens in the recipient's receiver
        receiverRef.deposit(from: <-self.sentVault)
    }
}
  `
}


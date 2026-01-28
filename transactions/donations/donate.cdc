import "Donations_Alexandria"
import "FungibleToken"
import "FlowToken"

transaction(amount: UFix64) {

    // The FlowToken vault being sent to the donations contract
    let sentVault: @{FungibleToken.Vault}

    // The address of the donor
    let donor: Address

    prepare(signer: auth(BorrowValue) &Account) {

        self.donor = signer.address

        // Get a reference to the signer's stored FlowToken vault
        let vaultRef = signer.storage.borrow<
            auth(FungibleToken.Withdraw) &FlowToken.Vault
        >(from: /storage/flowTokenVault)
        ?? panic(
            "The signer does not store a FlowToken.Vault object at the path /storage/flowTokenVault"
        )

        // Withdraw tokens from the signer's stored vault
        self.sentVault <- vaultRef.withdraw(amount: amount)
    }

    execute {
        // Call the donations contract function directly
        Donations_Alexandria.donate(
            from: <- self.sentVault as! @FlowToken.Vault,
            donor: self.donor
        )
    }
}
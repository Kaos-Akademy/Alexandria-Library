import "FungibleToken" 
import "FlowToken"

access(all) contract Donations_Alexandria {

    // Total donated per address
    access(self) var donations: {Address: UFix64}

    // Public function to donate FlowToken to this contract
    //
    // - `from` is the vault sent in from the transaction
    // - `donor` should be the address of the signer in the transaction
    access(all) fun donate(from: @FlowToken.Vault, donor: Address) {
        let amount: UFix64 = from.balance

        let receiverRef = Donations_Alexandria.account.capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("FlowToken receiver capability is not set up on contract account")

        // Deposit tokens into the contract account's Flow vault
        receiverRef.deposit(from: <- from)

        // Update total donated per address
        let current = self.donations[donor] ?? 0.0
        self.donations[donor] = current + amount
    }

    // Returns a copy of the donations map
    access(all) fun getDonations(): {Address: UFix64} {
        return self.donations
    }

    // Convenience: get a specific address's total donated
    access(all) fun getDonationTotal(address: Address): UFix64 {
        return self.donations[address] ?? 0.0
    }

    init() {
        self.donations = {}

    }
}
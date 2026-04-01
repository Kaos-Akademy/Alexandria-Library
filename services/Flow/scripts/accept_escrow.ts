/**
 * Accept Escrow (Withdraw Funds to Platform) Transaction
 *
 * This transaction allows the platform to accept the offer on behalf of the artist
 * and withdraw the funds from the escrow handler to the platform wallet.
 * The platform will then distribute the funds according to the profit split.
 *
 * Prerequisites:
 * - Platform must have already claimed the escrow capability using claim_escrow_capability
 *
 * Flow:
 * 1. Platform calls this transaction with the escrow handlerId and platform address
 * 2. Capability is borrowed from storage
 * 3. Funds are withdrawn from escrow
 * 4. Funds are deposited to platform's Flow vault (for later distribution)
 */
export const acceptEscrow = (
  EscrowContractAddress: string | undefined,
  FlowTokenAddress: string | undefined,
  FungibleTokenAddress: string | undefined,
) => {
  return `
import Escrow from ${EscrowContractAddress}
import FlowToken from ${FlowTokenAddress}
import FungibleToken from ${FungibleTokenAddress}

transaction(handlerId: UInt64, platformAddress: Address) {
    let capRef: &Capability<auth(Escrow.Owner) &Escrow.Handler>

    prepare(signer: auth(ClaimInboxCapability, Storage) &Account) {
        let storagePath = StoragePath(identifier: "\\(Escrow.getAddress())_Escrow_Handler_\\(handlerId)")!

        // Borrow the capability from storage
        self.capRef = signer.storage.borrow<&Capability<auth(Escrow.Owner) &Escrow.Handler>>(from: storagePath)
            ?? panic("Could not borrow escrow capability. Please claim the capability first.")

        // Withdraw funds from escrow
        let allowed = self.capRef.borrow()!
        let vault <- allowed.withdrawFunds()

        // Get platform receiver capability
        let platformAccount = getAccount(platformAddress)
        let platformReceiverRef = platformAccount.capabilities
            .borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)
            ?? panic("Could not borrow platform receiver reference")

        // Deposit to platform's vault for distribution
        platformReceiverRef.deposit(from: <- vault.withdraw(amount: vault.balance))
        destroy vault

        log("ESCROW_ACCEPTED_TO_PLATFORM:")
        log(handlerId)
    }

    execute {
        // Funds withdrawn and deposited to platform for distribution
    }
}
  `
}


/**
 * Claim and Accept Escrow (Combined Transaction)
 *
 * This transaction combines two operations into one to avoid sequence number conflicts:
 * 1. Claim the escrow capability from inbox
 * 2. Accept the escrow and withdraw funds to platform
 *
 * This is more efficient and avoids the need to wait between transactions.
 *
 * Flow:
 * 1. Artist/Platform calls this transaction with escrow handlerId, provider, and platform address
 * 2. Capability is claimed from inbox and saved to storage
 * 3. Funds are withdrawn from escrow
 * 4. Funds are deposited to platform's Flow vault (for later distribution)
 */
export const claimAndAcceptEscrow = (
  EscrowContractAddress: string | undefined,
  FlowTokenAddress: string | undefined,
  FungibleTokenAddress: string | undefined,
) => {
  return `
import Escrow from ${EscrowContractAddress}
import FlowToken from ${FlowTokenAddress}
import FungibleToken from ${FungibleTokenAddress}

transaction(handlerId: UInt64, provider: Address, platformAddress: Address) {
    prepare(signer: auth(ClaimInboxCapability, Storage) &Account) {
        let inboxIdentifier = "\\(signer.address)_Escrow_Handler_\\(handlerId)"
        let storagePath = Escrow.getHandlerStoragePath(handlerId)

        // Step 1: Claim the capability from inbox (if not already claimed)
        var cap: Capability<auth(Escrow.Owner) &Escrow.Handler>? = nil
        
        // Try to claim from inbox
        cap = signer.inbox.claim<auth(Escrow.Owner) &Escrow.Handler>(inboxIdentifier, provider: provider)
        
        if cap != nil {
            // Save capability to storage if we just claimed it
            signer.storage.save(cap!, to: storagePath)
            log("ESCROW_CAPABILITY_CLAIMED:")
            log(handlerId)
        } else {
            // Capability might already be claimed, that's okay
            log("ESCROW_CAPABILITY_ALREADY_CLAIMED:")
            log(handlerId)
        }

        // Step 2: Borrow the capability from storage and withdraw funds
        let capRef = signer.storage.borrow<&Capability<auth(Escrow.Owner) &Escrow.Handler>>(from: storagePath)
            ?? panic("Could not borrow escrow capability from storage")

        // Withdraw funds from escrow
        let allowed = capRef.borrow()!
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
        // Capability claimed (if needed) and funds withdrawn to platform
    }
}
  `
}


/**
 * Claim Escrow Capability Transaction
 * 
 * This transaction allows the receiver (artist) to claim the escrow capability
 * from their inbox and save it to their storage.
 * 
 * This is a prerequisite before the artist can accept the offer and withdraw funds.
 * 
 * Flow:
 * 1. Artist calls this transaction with the escrow handlerId
 * 2. Capability is claimed from inbox
 * 3. Capability is saved to artist's storage
 */
export const claimEscrowCapability = (
  EscrowContractAddress: string | undefined,
) => {
  return `
import Escrow from ${EscrowContractAddress}

transaction(handlerId: UInt64, provider: Address) {
    prepare(signer: auth(ClaimInboxCapability, Storage) &Account) {
        let inboxIdentifier = "\\(signer.address)_Escrow_Handler_\\(handlerId)"
        let storagePath = Escrow.getHandlerStoragePath(handlerId)

        // Claim the capability from inbox
        let cap: Capability<auth(Escrow.Owner) &Escrow.Handler> = signer.inbox.claim<auth(Escrow.Owner) &Escrow.Handler>(inboxIdentifier, provider: provider)!
        
        // Save capability to storage
        signer.storage.save(cap, to: storagePath)
    }

    execute {
        // Capability claimed and saved
    }
}
  `
}


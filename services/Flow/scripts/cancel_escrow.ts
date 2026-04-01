/**
 * Cancel Escrow (Refund) Transaction
 * 
 * This transaction allows the sender (buyer) to cancel the escrow and get their funds back
 * immediately when an offer is rejected, instead of waiting 7 days for the automatic refund.
 * 
 * Flow:
 * 1. Buyer calls this transaction with the escrow handlerId
 * 2. Handler is borrowed from storage
 * 3. Funds are withdrawn from escrow
 * 4. Funds are deposited back to buyer's Flow vault
 * 5. Handler is destroyed
 */
export const cancelEscrow = (
  EscrowContractAddress: string | undefined,
  FlowTokenAddress: string | undefined,
  FungibleTokenAddress: string | undefined,
) => {
  return `
import Escrow from ${EscrowContractAddress}
import FlowToken from ${FlowTokenAddress}
import FungibleToken from ${FungibleTokenAddress}

transaction(handlerId: UInt64) {
    prepare(signer: auth(Storage) &Account) {
        let handlerStoragePath = Escrow.getHandlerStoragePath(handlerId)
        
        // Borrow the handler from storage
        let handlerRef = signer.storage.borrow<&Escrow.Handler>(from: handlerStoragePath)
            ?? panic("Could not borrow escrow handler. Handler not found or already processed.")
        
        // Refund the funds back to the buyer
        let vault <- handlerRef.refund()
        
        // Deposit to buyer's vault
        let receiverRef = signer.capabilities.borrow<&{FungibleToken.Receiver}>(/public/flowTokenReceiver)!
        receiverRef.deposit(from: <- vault)
        
        // Remove the handler from storage (cleanup)
        let handler <- signer.storage.load<@Escrow.Handler>(from: handlerStoragePath)!
        destroy handler
    }

    execute {
        // Escrow cancelled and funds refunded to buyer
        log("ESCROW_CANCELLED:")
        log(handlerId)
    }
}
  `
}


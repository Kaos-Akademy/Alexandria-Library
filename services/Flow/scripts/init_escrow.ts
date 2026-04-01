/**
 * Initialize Escrow Transaction
 *
 * This transaction creates an escrow handler that holds Flow tokens for 7 days.
 * If the receiver (artist) doesn't accept the offer within 7 days, the funds
 * are automatically returned to the sender (buyer).
 *
 * Flow:
 * 1. Buyer calls this transaction with offer amount and artist address
 * 2. Funds are locked in an Escrow Handler
 * 3. A scheduled transaction is created to refund after 7 days
 * 4. A capability is published to the artist's inbox
 */
export const initEscrow = (
  EscrowContractAddress: string | undefined,
  FlowTokenAddress: string | undefined,
  FungibleTokenAddress: string | undefined,
  FlowTransactionSchedulerAddress: string | undefined,
) => {
  return `
import Escrow from ${EscrowContractAddress}
import FlowToken from ${FlowTokenAddress}
import FungibleToken from ${FungibleTokenAddress}
import FlowTransactionScheduler from ${FlowTransactionSchedulerAddress}

transaction(amount: UFix64, receiver: Address) {
    let handlerId: UInt64

    prepare(signer: auth(Storage, Capabilities, Inbox) &Account) {
        // Schedule refund for 7 days in the future
        let future = getCurrentBlock().timestamp + UFix64(7 * 24 * 60 * 60)
        let priority = FlowTransactionScheduler.Priority.High

        // Estimate fees for the scheduled transaction
        let est = FlowTransactionScheduler.estimate(
            data: "",
            timestamp: future,
            priority: priority,
            executionEffort: 1000
        )

        assert(
            est.timestamp != nil || priority == FlowTransactionScheduler.Priority.High,
            message: est.error ?? "Estimation failed"
        )

        // Get reference to Flow vault
        let vaultRef = signer.storage
            .borrow<auth(FungibleToken.Withdraw) &FlowToken.Vault>(from: /storage/flowTokenVault)
            ?? panic("Missing FlowToken vault")

        // Withdraw fees and offer amount
        let fees <- vaultRef.withdraw(amount: est.flowFee ?? 0.0) as! @FlowToken.Vault
        let offer <- vaultRef.withdraw(amount: amount) as! @FlowToken.Vault

        // Create escrow handler
        let handler <- Escrow.createHandler(offerVault: <- offer, receiver: receiver)

        // Store handlerId for logging in execute block
        self.handlerId = handler.handlerId

        // Get storage path for handler
        let handlerStoragePath = Escrow.getHandlerStoragePath(handler.handlerId)

        // Save handler to storage
        signer.storage.save(<-handler, to: handlerStoragePath)

        // Issue capability to the handler for the scheduled transaction
        let handlerCap = signer.capabilities.storage
            .issue<auth(FlowTransactionScheduler.Execute) &{FlowTransactionScheduler.TransactionHandler}>(handlerStoragePath)

        // Schedule the refund transaction
        let receipt <- FlowTransactionScheduler.schedule(
            handlerCap: handlerCap,
            data: nil,
            timestamp: future,
            priority: priority,
            executionEffort: 1000,
            fees: <-fees
        )

        // Deposit the receipt to the handler
        let handlerRef = signer.storage.borrow<&Escrow.Handler>(from: handlerStoragePath)!
        handlerRef.depositReceipt(receipt: <-receipt)

        // Publish capability to artist's inbox
        let inboxIdentifier = "\\(receiver)_Escrow_Handler_\\(handlerRef.handlerId)"
        let handlerInbox = signer.capabilities.storage.issue<auth(Escrow.Owner) &Escrow.Handler>(Escrow.getHandlerStoragePath(handlerRef.handlerId))
        signer.inbox.publish(handlerInbox, name: inboxIdentifier, recipient: receiver)
    }

    execute {
        // Handler created and funds locked
        // Log the handlerId so it can be extracted from transaction results
        log("ESCROW_HANDLER_ID:")
        log(self.handlerId)
    }
}
  `
}


import * as fcl from '@onflow/fcl'
import { donateTx } from './transactions/donate'
import { getDonorBalance } from './scripts/getDonorBalance'

/**
 * Sends a donation in FLOW to the Donations_Alexandria contract.
 *
 * @param amountUFix64 Amount as a UFix64-compatible string, e.g. "1.0"
 */
export const sendDonation = async (amountUFix64: string) => {
  const txId = await fcl.mutate({
    cadence: donateTx(),
    args: (arg, t) => [arg(amountUFix64, t.UFix64)],
    limit: 200,
  })

  return fcl.tx(txId).onceSealed()
}

/**
 * Returns the FLOW balance for the Prime librarian account
 * that is used as the donation target.
 * Note: FlowToken uses 8 decimal places, so we need to divide by 10^8
 */
export const fetchDonationBalance = async (): Promise<number> => {
  const FLOW_DECIMALS = 100000000 // 10^8

  try {
    // Try using FCL account query first (more reliable)
    const account = await fcl.account('0xfed1adffd14ea9d0')
    if (account?.balance !== undefined) {
      // FCL returns balance as a string in UFix64 format (smallest unit)
      const balanceStr = typeof account.balance === 'string' ? account.balance : String(account.balance)
      const numeric = Number(balanceStr)
      if (Number.isFinite(numeric)) {
        return numeric / FLOW_DECIMALS // Convert from smallest unit to FLOW
      }
    }
  } catch (e) {
    console.warn('FCL account query failed, trying Cadence script:', e)
  }

  // Fallback to Cadence script
  try {
    const raw = await fcl.query({
      cadence: getDonorBalance(),
      args: () => [],
    })

    const asString = typeof raw === 'string' ? raw : String(raw)
    const numeric = Number(asString)
    if (Number.isFinite(numeric)) {
      return numeric / FLOW_DECIMALS // Convert from smallest unit to FLOW
    }
  } catch (e) {
    console.error('Cadence script also failed:', e)
  }
  
  return 0
}


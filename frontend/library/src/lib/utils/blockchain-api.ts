/**
 * Flow Wallet API / Blockchain API URL helpers.
 * Used by Flow services to submit transactions.
 */

export function getBlockchainApiUrl(): string {
  const url = process.env.BLOCKCHAIN_API_URL
  if (!url) {
    throw new Error('BLOCKCHAIN_API_URL is not set')
  }
  return url.replace(/\/$/, '')
}

export function getFlowVerificationUrl(): string {
  const url = process.env.FLOW_VERIFICATION_URL
  if (url) return url.replace(/\/$/, '')
  const network = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'
  return network === 'mainnet'
    ? 'https://rest-mainnet.onflow.org'
    : 'https://rest-testnet.onflow.org'
}

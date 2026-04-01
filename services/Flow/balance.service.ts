import { env } from '@/lib/zod/env'
import { getFlowContractAddresses } from '@/lib/utils/flow-addresses'

interface BalanceResponse {
  balance: string
  hasEnoughFunds: boolean
  requiredAmount: number
  shortfall: number
}

class FlowBalanceService {
  private MAX_RETRIES = 3
  private RETRY_DELAY_MS = 2000 // 2 segundos

  /**
   * Sleep utility para reintentos
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get the FLOW token balance for an address using Flow Access API with retries
   */
  async getBalance(address: string): Promise<number> {
    let lastError: Error | null = null

    // Get dynamic contract addresses
    const addresses = getFlowContractAddresses()

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        console.log(`🔍 Fetching FLOW balance for ${address}... (attempt ${attempt}/${this.MAX_RETRIES})`)

        // Cadence script to get FlowToken balance (Cadence 1.0 syntax)
        const script = `
import FungibleToken from ${addresses.FungibleToken}
import FlowToken from ${addresses.FlowToken}

access(all) fun main(address: Address): UFix64 {
  let account = getAccount(address)
  let vaultRef = account.capabilities.borrow<&{FungibleToken.Balance}>(/public/flowTokenBalance) ?? panic("Could not borrow Balance reference")
  return vaultRef.balance
}
`.trim()

        // Encode script to base64
        const scriptBase64 = Buffer.from(script).toString('base64')

        // Encode argument as JSON then to base64
        const argumentJson = JSON.stringify({ type: 'Address', value: address })
        const argumentBase64 = Buffer.from(argumentJson).toString('base64')

        // ✅ Usar API PÚBLICA de Flow, no el backend interno
        const FLOW_API_URL = env.NEXT_PUBLIC_FLOW_NETWORK === 'mainnet'
          ? 'https://rest-mainnet.onflow.org'
          : 'https://rest-testnet.onflow.org'

        // Call Flow Access API to execute script
        const response = await fetch(`${FLOW_API_URL}/v1/scripts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: scriptBase64,
            arguments: [argumentBase64],
          }),
        })

        if (!response.ok) {
          const errorText = await response.text()
          
          // Si es un error 502/503 (servidor caído), reintentar
          if (response.status === 502 || response.status === 503) {
            console.warn(`⚠️  Flow API temporalmente no disponible (${response.status}), reintentando en ${this.RETRY_DELAY_MS / 1000}s...`)
            lastError = new Error(`Flow API error: ${response.status} - Server temporarily unavailable`)
            
            if (attempt < this.MAX_RETRIES) {
              await this.sleep(this.RETRY_DELAY_MS * attempt) // Exponential backoff
              continue
            }
          }
          
          console.error('❌ Flow API error response:', errorText)
          throw new Error(`Flow API error: ${response.status} - ${errorText}`)
        }

        // Response comes as base64-encoded JSON
        const dataBase64 = await response.json()
        
        // Decode the base64 response
        const decoded = JSON.parse(Buffer.from(dataBase64 as string, 'base64').toString('utf-8'))
        
        // The balance is returned as a string in UFix64 format
        const balanceNumber = parseFloat(decoded.value || '0')
        
        console.log(`✅ Balance fetched: ${balanceNumber.toFixed(4)} FLOW for ${address}`)
        
        return balanceNumber
      } catch (error) {
        lastError = error as Error
        
        // Si es el último intento, lanzar el error
        if (attempt === this.MAX_RETRIES) {
          console.error(`❌ Error fetching Flow balance after ${this.MAX_RETRIES} attempts:`, error)
          throw error
        }
        
        // Si no es el último intento, esperar y reintentar
        console.warn(`⚠️  Attempt ${attempt} failed, retrying in ${this.RETRY_DELAY_MS / 1000}s...`)
        await this.sleep(this.RETRY_DELAY_MS * attempt)
      }
    }

    // Si llegamos aquí, lanzar el último error
    throw lastError || new Error('Unknown error fetching Flow balance')
  }

  /**
   * Check if an address has enough FLOW to make a payment
   * @param address - The Flow wallet address
   * @param requiredAmount - Amount of FLOW needed
   * @param buffer - Safety buffer (default 0.1 FLOW for gas)
   */
  async hasEnoughBalance(
    address: string,
    requiredAmount: number,
    buffer: number = 0.1,
  ): Promise<BalanceResponse> {
    const balance = await this.getBalance(address)
    const totalRequired = requiredAmount + buffer
    const hasEnoughFunds = balance >= totalRequired

    return {
      balance: balance.toFixed(8),
      hasEnoughFunds,
      requiredAmount: totalRequired,
      shortfall: hasEnoughFunds ? 0 : totalRequired - balance,
    }
  }
}

const flowBalanceService = new FlowBalanceService()
export default flowBalanceService


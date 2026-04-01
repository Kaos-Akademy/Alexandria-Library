import { env } from '@/lib/zod/env'
import { getBlockchainApiUrl, getFlowVerificationUrl } from '@/lib/utils/blockchain-api'
import { getFlowContractAddresses } from '@/lib/utils/flow-addresses'
import scripts from './scripts'
import { fcl, configureFCL } from './fcl.config'
import {
  extractCertificateIdFromEvents,
  extractFlowFailureMessage,
  extractFlowTransactionId,
  isSealedSuccess,
  isSealedWithError,
} from './utils/mintTransaction'

/**
 * Cleans up Flow error messages to extract just the meaningful error
 * Removes verbose Cadence runtime error formatting and extracts the actual error message
 */
function cleanFlowErrorMessage(errorMessage: string): string {
  // Look for lines that start with "error: " - this is the actual error
  const errorLineMatch = errorMessage.match(/^error:\s*(.+)$/m)
  if (errorLineMatch) {
    return `error: ${errorLineMatch[1].trim()}`
  }

  // Fallback: look for "error:" anywhere in the message
  const errorMatch = errorMessage.match(/error:\s*([^\n]+)/i)
  if (errorMatch) {
    return `error: ${errorMatch[1].trim()}`
  }

  // If no clean error found, return the original (might be a simple error message already)
  return errorMessage.trim()
}

// Get dynamic contract addresses based on current network (testnet/mainnet)
const addresses = getFlowContractAddresses()

const MnemeContractAddress: string | undefined = addresses.Mneme.address
const MnemeContractName: string | undefined = addresses.Mneme.name
const MetadataViewsContractAddress: string | undefined = addresses.MetadataViews
const NonFungibleTokenContractAddress: string | undefined = addresses.NonFungibleToken
const FungibleTokenContractAddress: string | undefined = addresses.FungibleToken
const FlowTokenContractAddress: string | undefined = addresses.FlowToken
const EscrowContractAddress: string | undefined = addresses.Escrow
const FlowTransactionSchedulerContractAddress: string | undefined = addresses.TransactionScheduler

class FlowService {
  // Mint certificate NFT (called by artist's account)
  async mintCertificate(artistAddress: string, editionId: number, thumbnail: string) {
    try {
      const requestBody = {
        code: scripts.mintCertificate(MnemeContractAddress, MnemeContractName),
        arguments: [
          {
            type: 'Address',
            value: artistAddress,
          },
          {
            type: 'UInt64',
            value: editionId.toString(),
          },
          {
            type: 'String',
            value: thumbnail,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using artist's account address
      const response = await fetch(
        `${getBlockchainApiUrl()}/v1/accounts/${artistAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      // Try to fetch mint events and extract certificateId
      const transactionId = extractFlowTransactionId(responseData as Record<string, unknown>)

      if (!transactionId) {
        return responseData
      }

      try {
        const FLOW_TESTNET_API = getFlowVerificationUrl()
        const MAX_RETRIES = 60 // Maximum number of polling attempts (2 minutes total)
        const POLL_INTERVAL = 2000 // 2 seconds between polls

        let certificateId: string | number | undefined

        // Poll for transaction to seal
        for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
          const eventsResponse = await fetch(
            `${FLOW_TESTNET_API}/v1/transactions/${transactionId}?expand=result`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )

          if (!eventsResponse.ok) {
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
              continue
            }
            break
          }

          const transactionData = await eventsResponse.json()
          const result = transactionData.result

          if (result) {
            if (isSealedWithError(result)) {
              throw new Error(extractFlowFailureMessage(result))
            }

            // Transaction is sealed when status is "Sealed" and statusCode is 0 (success)
            if (isSealedSuccess(result)) {
              const events = result.events || []
              try {
                const extractedCertificateId = extractCertificateIdFromEvents({
                  events,
                  contractAddress: MnemeContractAddress,
                  contractName: MnemeContractName,
                })
                if (extractedCertificateId !== undefined) {
                  certificateId = extractedCertificateId
                }
              } catch (decodeError) {
                // Continue to next attempt if decoding fails
                console.warn('⚠️ Failed to decode mint event payload:', decodeError)
              }

              // If we found the certificateId, break out of polling loop
              if (certificateId !== undefined) {
                break
              }
            }
          }

          // Transaction not yet sealed, wait and retry
          if (attempt < MAX_RETRIES - 1) {
            await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
          }
        }

        // Return response with certificateId if found
        if (certificateId !== undefined) {
          return {
            ...responseData,
            certificateId,
          }
        }

        return responseData
      } catch (eventError) {
        console.error('❌ Error fetching mintCertificate transaction events:', eventError)
        return responseData
      }
    } catch (error) {
      console.error(
        error,
        `Error when trying to mint certificate for editionId:${editionId} with artist:${artistAddress}`,
      )
      throw error
    }
  }
  // Claim mint certificate capability (called by artist's account)
  async claimMintCap(artistAddress: string, editionId: number) {
    try {
      const requestBody = {
        code: scripts.claimMintCap(MnemeContractAddress, MnemeContractName),
        arguments: [
          {
            type: 'UInt64',
            value: editionId.toString(),
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using artist's account address
      const response = await fetch(
        `${getBlockchainApiUrl()}/v1/accounts/${artistAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      console.error(
        error,
        `Error when trying to claim mint cap for editionId:${editionId} with artist:${artistAddress}`,
      )
      throw error
    }
  }

  // Admin republishes mint capability to artist's inbox (for contract migration)
  async adminRepublishMintCap(artistAddress: string, editionId: number, adminAddress: string) {
    try {
      const requestBody = {
        code: scripts.adminRepublishMintCap(MnemeContractAddress, MnemeContractName),
        arguments: [
          {
            type: 'Address',
            value: artistAddress,
          },
          {
            type: 'UInt64',
            value: editionId.toString(),
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using admin's account address
      const response = await fetch(
        `${getBlockchainApiUrl()}/v1/accounts/${adminAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      console.error(
        error,
        `Error when trying to republish mint cap for editionId:${editionId} to artist:${artistAddress}`,
      )
      throw error
    }
  }

  // Edit edition rules (called by artist's account)
  async editEditionRules(
    artistAddress: string,
    editionID: number,
    name?: string,
    price?: number,
    type?: string,
    story?: string,
    dimensions?: { height: number; width: number; weight: number },
    reprintLimit?: number,
  ) {
    try {
      // Build arguments array - artistAddress and editionID are required
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const argumentsArray: Array<{ type: string; value: any }> = [
        {
          type: 'Address',
          value: artistAddress,
        },
        {
          type: 'UInt64',
          value: editionID.toString(),
        },
      ]

      // Add optional arguments if provided
      // Flow optional parameters should be wrapped in Optional type
      if (name !== undefined) {
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'String',
            value: name,
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      if (price !== undefined) {
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'UFix64',
            value: Number(price).toFixed(1),
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      if (type !== undefined) {
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'String',
            value: type,
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      if (story !== undefined) {
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'String',
            value: story,
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      if (dimensions !== undefined) {
        // Convert dimensions object to Flow's dictionary format {String: String}
        const dimensionsArray = Object.entries(dimensions).map(([key, value]) => ({
          key: {
            type: 'String',
            value: key,
          },
          value: {
            type: 'String',
            value: value.toString(),
          },
        }))
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'Dictionary',
            value: dimensionsArray,
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      if (reprintLimit !== undefined) {
        argumentsArray.push({
          type: 'Optional',
          value: {
            type: 'Int64',
            value: reprintLimit.toString(),
          },
        })
      } else {
        argumentsArray.push({
          type: 'Optional',
          value: null,
        })
      }

      const requestBody = {
        code: scripts.artistEditEditionRules(MnemeContractAddress, MnemeContractName),
        arguments: argumentsArray,
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using artist's account address
      const response = await fetch(
        `${getBlockchainApiUrl()}/v1/accounts/${artistAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      // Try to fetch transaction status and extract errors if any
      const transactionId =
        responseData.id ||
        responseData.transactionId ||
        responseData.txId ||
        responseData.transaction_id

      if (transactionId) {
        try {
          const FLOW_TESTNET_API = 'https://rest-testnet.onflow.org'
          const MAX_RETRIES = 60 // Maximum number of polling attempts (2 minutes total)
          const POLL_INTERVAL = 2000 // 2 seconds between polls

          // Poll for transaction to seal
          for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
            const statusResponse = await fetch(
              `${FLOW_TESTNET_API}/v1/transactions/${transactionId}?expand=result`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              },
            )

            if (!statusResponse.ok) {
              if (attempt < MAX_RETRIES - 1) {
                await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
                continue
              }
              break
            }

            const transactionData = await statusResponse.json()
            const result = transactionData.result

            if (result) {
              const status = result.status
              const statusCode = result.status_code

              // Transaction is sealed when status is "Sealed" or "Expired"
              const isSealed =
                status === 'Sealed' ||
                status === 'SEALED' ||
                status === 'Expired' ||
                status === 'EXPIRED'

              if (isSealed) {
                // Check if transaction failed
                if (statusCode !== 0 || result.execution !== 'Success') {
                  // Extract error message from transaction result
                  // Flow errors can be in multiple places: error_message, logs, execution.error, etc.
                  let errorMessage = 'Transaction failed'

                  // Check error_message (with underscore) - this is the most common location
                  if (result.error_message) {
                    errorMessage = result.error_message
                  }
                  // Check errorMessage (camelCase)
                  else if (result.errorMessage) {
                    errorMessage = result.errorMessage
                  }
                  // Check logs array - errors are often logged here
                  else if (result.logs && Array.isArray(result.logs) && result.logs.length > 0) {
                    // Look for error messages in logs (usually the last log entry contains the error)
                    const errorLog =
                      result.logs.find(
                        (log: string) =>
                          log.includes('error') ||
                          log.includes('failed') ||
                          log.includes('pre-condition'),
                      ) || result.logs[result.logs.length - 1]
                    if (errorLog) {
                      errorMessage = errorLog
                    }
                  }
                  // Check execution.error.message
                  else if (result.execution?.error?.message) {
                    errorMessage = result.execution.error.message
                  }
                  // Check execution.error (could be a string or object)
                  else if (result.execution?.error) {
                    errorMessage =
                      typeof result.execution.error === 'string'
                        ? result.execution.error
                        : JSON.stringify(result.execution.error)
                  }
                  // Check error field
                  else if (result.error) {
                    errorMessage =
                      typeof result.error === 'string' ? result.error : JSON.stringify(result.error)
                  }

                  // If we still don't have a good error message, log the full result for debugging
                  if (errorMessage === 'Transaction failed') {
                    console.warn(
                      '⚠️ Could not extract error message from transaction result. Full result:',
                      JSON.stringify(result, null, 2),
                    )
                  }

                  // Clean up the error message - extract just the meaningful part
                  // Flow errors often contain verbose output, we want just the actual error
                  const cleanedErrorMessage = cleanFlowErrorMessage(errorMessage)

                  // Return response with error information
                  return {
                    ...responseData,
                    error: cleanedErrorMessage,
                    transactionStatus: status,
                    transactionStatusCode: statusCode,
                  }
                }

                // Transaction succeeded
                break
              }
            }

            // Transaction not yet sealed, wait and retry
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
            }
          }
        } catch (pollError) {
          // If polling fails, still return the original response
          console.warn('⚠️ Failed to poll transaction status:', pollError)
        }
      }

      return responseData
    } catch (error) {
      console.error(
        error,
        `Error when trying to edit edition rules for editionID:${editionID} with artist:${artistAddress}`,
      )
      throw error
    }
  }

  // Transfer certificate NFT (called by sender's account)
  async transferCertificate(fromAddress: string, toAddress: string, certificateId: number) {
    try {
      const requestBody = {
        code: scripts.transferCertificate(
          MnemeContractAddress,
          MnemeContractName,
          NonFungibleTokenContractAddress,
          MetadataViewsContractAddress,
        ),
        arguments: [
          {
            type: 'Address',
            value: toAddress,
          },
          {
            type: 'UInt64',
            value: certificateId.toString(),
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using sender's account address
      const response = await fetch(
        `${getBlockchainApiUrl()}/v1/accounts/${fromAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      throw error
    }
  }

  // Add FlowToken vaults to all certificates in user's account
  async addFlowVaultsToCertificates(userAddress: string) {
    try {
      const requestBody = {
        code: scripts.addFlowVaultsToCertificates(
          MnemeContractAddress,
          MnemeContractName,
          FungibleTokenContractAddress,
          FlowTokenContractAddress,
        ),
        arguments: [],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using user's account address
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${userAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      throw error
    }
  }

  // Deposit Flow tokens into a certificate NFT vault
  async depositFlowToCertificate(
    signerAddress: string,
    accountAddress: string,
    amount: number,
    certificateId: number,
  ) {
    try {
      const requestBody = {
        code: scripts.depositFlowToCertificate(
          MnemeContractAddress,
          MnemeContractName,
          FungibleTokenContractAddress,
          FlowTokenContractAddress,
        ),
        arguments: [
          {
            type: 'Address',
            value: accountAddress,
          },
          {
            type: 'UFix64',
            value: amount.toFixed(8),
          },
          {
            type: 'UInt64',
            value: certificateId.toString(),
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using signer's account address
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${signerAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      throw error
    }
  }

  // Withdraw Flow tokens from a certificate NFT vault (called by user's account)
  async withdrawFlow(userAddress: string) {
    try {
      const requestBody = {
        code: scripts.withdrawFlow(
          MnemeContractAddress,
          MnemeContractName,
          FlowTokenContractAddress,
        ),
        arguments: [],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API using user's account address
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${userAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Blockchain API error: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()
      return responseData
    } catch (error) {
      console.error(
        error,
        `Error when trying to withdraw Flow from certificate for user:${userAddress}`,
      )
      throw error
    }
  }

  // Get certificate balance from blockchain (read-only query)
  async getCertificateBalance(ownerAddress: string, certificateId: number) {
    try {
      const script = scripts.getCertificateBalance(
        NonFungibleTokenContractAddress,
        MnemeContractAddress,
        MnemeContractName,
        FlowTokenContractAddress,
      )

      // Use Flow REST API directly on server-side (FCL doesn't work well on server)
      // On client-side, use FCL
      if (typeof window === 'undefined') {
        // Server-side: Use Flow REST API
        const FLOW_NETWORK = process.env.NEXT_PUBLIC_FLOW_NETWORK || 'testnet'
        const accessNodeApi =
          FLOW_NETWORK === 'mainnet'
            ? 'https://rest-mainnet.onflow.org'
            : 'https://rest-testnet.onflow.org'

        // Encode script to base64
        const scriptBase64 = Buffer.from(script).toString('base64')

        // Encode arguments as JSON then to base64 (same format as balance.service.ts)
        const argument1Json = JSON.stringify({ type: 'Address', value: ownerAddress })
        const argument1Base64 = Buffer.from(argument1Json).toString('base64')

        const argument2Json = JSON.stringify({ type: 'UInt64', value: certificateId.toString() })
        const argument2Base64 = Buffer.from(argument2Json).toString('base64')

        // Execute script using Flow REST API
        const response = await fetch(`${accessNodeApi}/v1/scripts`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            script: scriptBase64,
            arguments: [argument1Base64, argument2Base64],
          }),
        })

        if (!response.ok) {
          const errorText = await response.text().catch(() => 'Unknown error')
          throw new Error(
            `Flow REST API error: ${response.status} ${response.statusText} - ${errorText}`,
          )
        }

        const result = await response.json()

        // The result from Flow REST API can come as:
        // 1. Base64-encoded JSON string (needs decoding)
        // 2. Direct JSON object
        let decodedResult
        if (typeof result === 'string') {
          try {
            // Try decoding as base64 first
            decodedResult = JSON.parse(Buffer.from(result, 'base64').toString('utf-8'))
          } catch {
            try {
              // If not base64, try parsing as JSON string
              decodedResult = JSON.parse(result)
            } catch {
              // If all else fails, use the string as-is
              decodedResult = result
            }
          }
        } else {
          decodedResult = result
        }

        // Flow REST API returns dictionaries as { value: [{key, value}, ...], type: "Dictionary" }
        // We need to extract the key-value pairs from the array
        let extractedData: Record<string, unknown> = {}

        if (decodedResult?.type === 'Dictionary' && Array.isArray(decodedResult?.value)) {
          // Extract key-value pairs from the dictionary structure
          for (const item of decodedResult.value) {
            if (item?.key?.value && item?.value?.value !== undefined) {
              extractedData[item.key.value] = item.value.value
            }
          }
        } else if (typeof decodedResult === 'object' && decodedResult !== null) {
          // If it's already a plain object, use it directly
          extractedData = decodedResult as Record<string, unknown>
        }

        // The script returns {String: AnyStruct} with balance, vaultExists, collectionExists, and nftExists keys
        return {
          balance: extractedData?.balance || '0',
          vaultExists: extractedData?.vaultExists === true,
          collectionExists: extractedData?.collectionExists !== false, // Default to true if not explicitly false
          nftExists: extractedData?.nftExists !== false, // Default to true if not explicitly false
        }
      } else {
        // Client-side: Use FCL
        configureFCL()

        const response = await fcl.query({
          cadence: script,
          args: (arg, t) => [arg(ownerAddress, t.Address), arg(certificateId.toString(), t.UInt64)],
        })

        // The script returns {String: AnyStruct} with balance, vaultExists, collectionExists, and nftExists keys
        return {
          balance: response?.balance || '0',
          vaultExists: response?.vaultExists === true,
          collectionExists: response?.collectionExists !== false, // Default to true if not explicitly false
          nftExists: response?.nftExists !== false, // Default to true if not explicitly false
        }
      }
    } catch (error) {
      console.error(
        error,
        `Error when trying to get certificate balance for owner:${ownerAddress}, certificateId:${certificateId}`,
      )
      throw error
    }
  }

  // Transfer FLOW tokens from buyer to recipient (for purchases)
  async transferFlowTokens(
    fromAddress: string,
    toAddress: string,
    amount: number,
    metadata?: {
      offerId?: string
      paintingId?: string
      editionId?: string | null
      amountUSD?: number
      flowPrice?: number
    },
  ) {
    try {
      console.log('💰 Initiating FLOW token transfer:', {
        from: fromAddress,
        to: toAddress,
        amount,
        metadata,
      })

      const requestBody = {
        code: scripts.transferFlowTokens(FlowTokenContractAddress, FungibleTokenContractAddress),
        arguments: [
          {
            type: 'UFix64',
            value: amount.toFixed(8), // FLOW tokens with 8 decimals
          },
          {
            type: 'Address',
            value: toAddress,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Make POST request to blockchain API using buyer's account address
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${fromAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Blockchain API error:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to transfer FLOW tokens: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      console.log('✅ FLOW transfer successful:', {
        transactionId: responseData.id || responseData.transactionId,
        from: fromAddress,
        to: toAddress,
        amount,
      })

      return {
        transactionId: responseData.id || responseData.transactionId,
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error transferring FLOW tokens:', {
        error,
        from: fromAddress,
        to: toAddress,
        amount,
      })
      throw error
    }
  }

  // Get transaction status and details
  async getTransactionStatus(transactionId: string) {
    try {
      console.log('🔍 Fetching transaction status:', transactionId)

      // Use Flow verification URL (public API in development, internal in production)
      const verificationUrl = getFlowVerificationUrl()

      const response = await fetch(
        `${verificationUrl}/v1/transactions/${transactionId}?expand=result`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new Error(
          `Failed to fetch transaction: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const data = await response.json()

      // Check if response has result field (Flow Access API format)
      if (data.result) {
        const result = data.result
        const status = result.status || 'Unknown'
        const statusCode = result.status_code
        const execution = result.execution || 'Unknown'

        const isSuccess =
          (status === 'Sealed' || status === 'SEALED') &&
          statusCode === 0 &&
          execution === 'Success'

        const isFailed =
          (status === 'Sealed' || status === 'SEALED') &&
          (statusCode !== 0 || execution === 'Failure')

        console.log('✅ Transaction status fetched:', {
          transactionId,
          status,
          isSuccess,
          isFailed,
        })

        return {
          transactionId,
          status: status.toLowerCase(),
          statusCode,
          execution,
          isSuccess,
          isFailed,
          blockId: result.block_id,
          errorMessage: result.error_message || null,
          events: result.events || [],
          raw: data,
        }
      }

      // Handle custom blockchain API format (with transactionType field)
      if (data.transactionType) {
        // If transaction exists and has events, consider it successful
        const hasEvents = data.events && data.events.length > 0
        const isSuccess =
          hasEvents &&
          (data.transactionType === 'FtTransfer' || data.transactionType === 'NftTransfer')

        return {
          transactionId: data.transactionId,
          status: isSuccess ? 'sealed' : 'unknown',
          statusCode: isSuccess ? 0 : undefined,
          execution: isSuccess ? 'Success' : 'Unknown',
          isSuccess,
          isFailed: false,
          blockId: undefined,
          errorMessage: null,
          events: data.events || [],
          raw: data,
        }
      }

      // Fallback - unknown format
      throw new Error('Unknown transaction response format')
    } catch (error) {
      console.error('❌ Error fetching transaction status:', error)
      throw error
    }
  }

  /**
   * Wait for a transaction to be sealed
   * @param transactionId - Transaction ID to wait for
   * @param maxWaitSeconds - Maximum time to wait in seconds (default: 30)
   * @returns Transaction status when sealed
   */
  async waitForTransactionSealed(transactionId: string, maxWaitSeconds: number = 30) {
    const startTime = Date.now()
    const maxWaitMs = maxWaitSeconds * 1000
    const pollInterval = 2000 // Poll every 2 seconds

    console.log(`⏳ Waiting for transaction ${transactionId} to seal (max ${maxWaitSeconds}s)...`)

    while (Date.now() - startTime < maxWaitMs) {
      try {
        const status = await this.getTransactionStatus(transactionId)

        if (status.status === 'sealed' || status.status === 'SEALED') {
          console.log(`✅ Transaction sealed: ${transactionId}`)
          return status
        }

        if (status.isFailed) {
          throw new Error(`Transaction failed: ${status.errorMessage || 'Unknown error'}`)
        }

        // Wait before polling again
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      } catch (_error) {
        // If we can't fetch status, wait and try again
        console.warn(`⚠️ Could not fetch transaction status, retrying...`)
        await new Promise((resolve) => setTimeout(resolve, pollInterval))
      }
    }

    throw new Error(`Transaction did not seal within ${maxWaitSeconds} seconds`)
  }

  // ==================== ESCROW METHODS ====================

  /**
   * Initialize Escrow - Create an escrow handler for an offer
   * @param buyerAddress - Address of the buyer who is making the offer
   * @param artistAddress - Address of the artist receiving the offer
   * @param amount - Amount in FLOW tokens to lock in escrow
   * @param metadata - Optional metadata about the offer (offerId, paintingId, etc.)
   * @returns Transaction response with escrowHandlerId
   */
  async initEscrow(
    buyerAddress: string,
    artistAddress: string,
    amount: number,
    metadata?: {
      offerId?: string
      paintingId?: string
      editionId?: string | null
    },
  ) {
    try {
      console.log('🔒 Initializing escrow:', {
        buyer: buyerAddress,
        artist: artistAddress,
        amount,
        metadata,
      })

      const requestBody = {
        code: scripts.initEscrow(
          EscrowContractAddress,
          FlowTokenContractAddress,
          FungibleTokenContractAddress,
          FlowTransactionSchedulerContractAddress,
        ),
        arguments: [
          {
            type: 'UFix64',
            value: amount.toFixed(8),
          },
          {
            type: 'Address',
            value: artistAddress,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Execute transaction using buyer's account
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${buyerAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Escrow initialization failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to initialize escrow: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      const transactionId =
        responseData.id || responseData.transactionId || responseData.txId || null

      if (!transactionId) {
        throw new Error('No transaction ID returned from escrow initialization')
      }

      console.log('✅ Escrow initialized:', {
        transactionId,
        buyer: buyerAddress,
        artist: artistAddress,
        amount,
      })

      // Try to extract escrowHandlerId from transaction events
      const escrowHandlerId: number | null = null
      try {
        // Wait a bit for blockchain to index the transaction
        await new Promise((resolve) => setTimeout(resolve, 3000))

        const FLOW_TESTNET_API = 'https://rest-testnet.onflow.org'
        const eventsResponse = await fetch(
          `${FLOW_TESTNET_API}/v1/transaction_results/${transactionId}`,
        )

        if (eventsResponse.ok) {
          const eventsData = await eventsResponse.json()
          // The escrowHandlerId is stored in the Handler resource
          // We can extract it from the transaction result or storage
          // For now, we'll need to check the handler's handlerId field
          // This might require a separate script call to read the handler
          console.log('📋 Escrow transaction events:', eventsData.events)
        }
      } catch (eventError) {
        console.warn('⚠️ Could not extract escrowHandlerId from events:', eventError)
      }

      return {
        transactionId,
        escrowHandlerId, // May be null if we couldn't extract it
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error initializing escrow:', error)
      throw error
    }
  }

  /**
   * Claim Escrow Capability - Artist claims the capability from their inbox
   * @param artistAddress - Address of the artist claiming the capability
   * @param escrowHandlerId - ID of the escrow handler
   * @param buyerAddress - Address of the buyer who created the escrow (provider)
   * @returns Transaction response
   */
  async claimEscrowCapability(
    artistAddress: string,
    escrowHandlerId: number,
    buyerAddress: string,
  ) {
    try {
      console.log('📥 Claiming escrow capability:', {
        artist: artistAddress,
        escrowHandlerId,
        buyer: buyerAddress,
      })

      const requestBody = {
        code: scripts.claimEscrowCapability(EscrowContractAddress),
        arguments: [
          {
            type: 'UInt64',
            value: escrowHandlerId.toString(),
          },
          {
            type: 'Address',
            value: buyerAddress,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Execute transaction using artist's account
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${artistAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Claim escrow capability failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to claim escrow capability: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      console.log('✅ Escrow capability claimed:', {
        transactionId: responseData.id || responseData.transactionId,
        artist: artistAddress,
      })

      return {
        transactionId: responseData.id || responseData.transactionId,
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error claiming escrow capability:', error)
      throw error
    }
  }

  /**
   * Claim and Accept Escrow (Combined) - Claim capability and withdraw funds in one transaction
   * @param artistAddress - Address of the artist (signer)
   * @param escrowHandlerId - ID of the escrow handler
   * @param buyerAddress - Address of the buyer who created the escrow (provider)
   * @param platformAddress - Address of the platform wallet (will receive funds)
   * @returns Transaction response
   */
  async claimAndAcceptEscrow(
    artistAddress: string,
    escrowHandlerId: number,
    buyerAddress: string,
    platformAddress: string,
  ) {
    try {
      console.log('🔄 Claiming and accepting escrow in one transaction:', {
        artist: artistAddress,
        escrowHandlerId,
        buyer: buyerAddress,
        platform: platformAddress,
      })

      const requestBody = {
        code: scripts.claimAndAcceptEscrow(
          EscrowContractAddress,
          FlowTokenContractAddress,
          FungibleTokenContractAddress,
        ),
        arguments: [
          {
            type: 'UInt64',
            value: escrowHandlerId.toString(),
          },
          {
            type: 'Address',
            value: buyerAddress,
          },
          {
            type: 'Address',
            value: platformAddress,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Execute transaction using artist's account
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${artistAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Claim and accept escrow failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to claim and accept escrow: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      console.log('✅ Escrow claimed and accepted, funds transferred to platform:', {
        transactionId: responseData.id || responseData.transactionId,
        artist: artistAddress,
        platform: platformAddress,
      })

      return {
        transactionId: responseData.id || responseData.transactionId,
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error claiming and accepting escrow:', error)
      throw error
    }
  }

  /**
   * Accept Escrow - Platform accepts the offer and withdraws funds to platform wallet
   * @param platformAddress - Address of the platform wallet (will claim and receive funds)
   * @param escrowHandlerId - ID of the escrow handler
   * @returns Transaction response
   */
  async acceptEscrow(platformAddress: string, escrowHandlerId: number) {
    try {
      console.log('✅ Accepting escrow and withdrawing funds to platform:', {
        platform: platformAddress,
        escrowHandlerId,
      })

      const requestBody = {
        code: scripts.acceptEscrow(
          EscrowContractAddress,
          FlowTokenContractAddress,
          FungibleTokenContractAddress,
        ),
        arguments: [
          {
            type: 'UInt64',
            value: escrowHandlerId.toString(),
          },
          {
            type: 'Address',
            value: platformAddress,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Execute transaction using artist's account (platformAddress)
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${platformAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Accept escrow failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to accept escrow: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      console.log('✅ Escrow accepted, funds transferred to artist:', {
        transactionId: responseData.id || responseData.transactionId,
        artist: platformAddress,
      })

      return {
        transactionId: responseData.id || responseData.transactionId,
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error accepting escrow:', error)
      throw error
    }
  }

  /**
   * Cancel Escrow - Buyer cancels the offer and gets immediate refund
   * @param buyerAddress - Address of the buyer canceling the escrow
   * @param escrowHandlerId - ID of the escrow handler
   * @returns Transaction response
   */
  async cancelEscrow(buyerAddress: string, escrowHandlerId: number) {
    try {
      console.log('🔙 Canceling escrow and refunding buyer:', {
        buyer: buyerAddress,
        escrowHandlerId,
      })

      const requestBody = {
        code: scripts.cancelEscrow(
          EscrowContractAddress,
          FlowTokenContractAddress,
          FungibleTokenContractAddress,
        ),
        arguments: [
          {
            type: 'UInt64',
            value: escrowHandlerId.toString(),
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // Execute transaction using buyer's account
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${buyerAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        console.error('❌ Cancel escrow failed:', {
          status: response.status,
          statusText: response.statusText,
          body: errorText,
        })
        throw new Error(
          `Failed to cancel escrow: ${response.status} ${response.statusText} - ${errorText}`,
        )
      }

      const responseData = await response.json()

      console.log('✅ Escrow cancelled, funds refunded to buyer:', {
        transactionId: responseData.id || responseData.transactionId,
        buyer: buyerAddress,
      })

      return {
        transactionId: responseData.id || responseData.transactionId,
        status: responseData.status || 'pending',
        ...responseData,
      }
    } catch (error) {
      console.error('❌ Error canceling escrow:', error)
      throw error
    }
  }

  /**
   * Get Escrow Handler ID from buyer's account
   * This is a helper to retrieve the latest escrow handler ID
   * @param buyerAddress - Address of the buyer
   * @returns The latest escrow handler ID (or null if none found)
   */
  async getLatestEscrowHandlerId(_buyerAddress: string): Promise<number | null> {
    try {
      // This would require a Cadence script to read from the buyer's storage
      // For now, we'll return null and handle this in the backend
      console.warn('⚠️ getLatestEscrowHandlerId not yet implemented')
      return null
    } catch (error) {
      console.error('❌ Error getting escrow handler ID:', error)
      return null
    }
  }
}

const flowService = new FlowService()
export default flowService

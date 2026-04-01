import { env } from '@/lib/zod/env'
import { getFlowVerificationUrl } from '@/lib/utils/blockchain-api'
import { getFlowContractAddresses } from '@/lib/utils/flow-addresses'
import scripts from './scripts'

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

// Tipos para eventos de Flow
interface FlowEventField {
  name: string
  value?: {
    value: unknown
  }
}

interface FlowEventDecodedPayload {
  value?: {
    fields?: FlowEventField[]
  }
}

interface FlowEvent {
  type?: string
  payload?: string
  data?: Record<string, unknown>
  decodedPayload?: FlowEventDecodedPayload
  editionId?: number | string
  artistAddress?: string
  certificateId?: number | string
  originalId?: number | string
}

interface DecodedFlowEvent extends FlowEvent {
  decodedPayload: FlowEventDecodedPayload
  data: Record<string, unknown>
}

class AdminService {
  // Helper para construir event types dinámicamente
  private buildEventType(eventName: string): string {
    const contractAddressHex = MnemeContractAddress?.replace('0x', '') || ''
    return `A.${contractAddressHex}.${MnemeContractName}.${eventName}`
  }

  // Decode base64 event payload and extract useful fields
  private decodeEventPayload(event: FlowEvent): DecodedFlowEvent | FlowEvent {
    if (!event.payload) {
      return event
    }

    try {
      // Decode base64 payload
      const decodedPayload = Buffer.from(event.payload, 'base64').toString('utf-8')
      const parsedPayload = JSON.parse(decodedPayload) as FlowEventDecodedPayload

      // Extract fields from the payload
      const decodedData: Record<string, unknown> = {}
      if (parsedPayload.value?.fields && Array.isArray(parsedPayload.value.fields)) {
        for (const field of parsedPayload.value.fields) {
          if (field.name && field.value?.value !== undefined) {
            decodedData[field.name] = field.value.value
          }
        }
      }

      // Return event with decoded payload and extracted fields
      const editionIdValue = decodedData.editionId
      const artistAddressValue = decodedData.artistAddress
      const originalIdValue = decodedData.originalId

      return {
        ...event,
        decodedPayload: parsedPayload,
        data: decodedData,
        // Convenience accessors for common fields
        editionId:
          typeof editionIdValue === 'number' || typeof editionIdValue === 'string'
            ? editionIdValue
            : undefined,
        artistAddress: typeof artistAddressValue === 'string' ? artistAddressValue : undefined,
        // For mint events, certificate/token id is often under one of these keys
        certificateId:
          decodedData.certificateId ?? decodedData.id ?? decodedData.tokenId ?? undefined,
        // For original creation events
        originalId:
          typeof originalIdValue === 'number' || typeof originalIdValue === 'string'
            ? originalIdValue
            : undefined,
      } as DecodedFlowEvent
    } catch (error) {
      console.warn('⚠️ Failed to decode event payload:', error)
      return event
    }
  }

  // Fetch transaction events from Flow REST API
  private async fetchTransactionEvents(
    transactionId: string,
    maxRetries?: number,
  ): Promise<(DecodedFlowEvent | FlowEvent)[]> {
    // Use Flow verification URL (public API in development, internal in production)
    const verificationUrl = getFlowVerificationUrl()
    // Use consistent timeout across all environments (10 minutes)
    const MAX_RETRIES = maxRetries || 300 // 10 minutes (300 attempts * 2 seconds)
    const POLL_INTERVAL = 2000 // 2 seconds between polls
    const INITIAL_DELAY = 3000 // 3 seconds initial delay to allow transaction to be available in API

    console.log(
      `🔍 Starting to poll transaction ${transactionId} for events (max ${MAX_RETRIES} attempts, ${MAX_RETRIES * (POLL_INTERVAL / 1000)} seconds)`,
    )

    // Wait a bit before starting to poll to allow transaction to be available in the API
    // This prevents initial 404 errors
    await new Promise((resolve) => setTimeout(resolve, INITIAL_DELAY))

    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
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
          // 404 is expected when transaction is just created and not yet available in API
          // Don't treat it as a critical error, just continue polling
          if (response.status === 404) {
            // Log only on first attempt or every 10 attempts to avoid spam
            if (attempt === 0 || attempt % 10 === 0) {
              console.log(
                `⏳ Transaction ${transactionId} not yet available in API (404), continuing to poll...`,
              )
            }
            // Wait and retry
            if (attempt < MAX_RETRIES - 1) {
              await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
            }
            continue
          }
          // For other errors, throw
          throw new Error(`Flow API error: ${response.status} ${response.statusText}`)
        }

        const transactionData = await response.json()

        // Check if transaction result exists
        if (transactionData.result) {
          const result = transactionData.result
          const status = result.status
          const statusCode = result.status_code
          const execution = result.execution

          // Log progress every 10 attempts (20 seconds) or on first attempt
          if (attempt === 0 || attempt % 10 === 0) {
            console.log(
              `⏳ Polling transaction ${transactionId} (attempt ${attempt + 1}/${MAX_RETRIES}): status=${status}, statusCode=${statusCode}, execution=${execution}`,
            )
          }

          // Transaction is sealed when status is "Sealed" (capitalized) and statusCode is 0 (success)
          const isSealed =
            (status === 'Sealed' || status === 'SEALED') &&
            statusCode === 0 &&
            execution === 'Success'

          if (isSealed) {
            console.log(`✅ Transaction ${transactionId} is sealed. Extracting events...`)
            // Decode event payloads and return events with decoded data
            const events = (result.events || []) as FlowEvent[]
            console.log(`📦 Found ${events.length} events in transaction`)
            return events.map((event: FlowEvent) => this.decodeEventPayload(event))
          }
        } else {
          // Log if no result yet (every 10 attempts)
          if (attempt === 0 || attempt % 10 === 0) {
            console.log(
              `⏳ Transaction ${transactionId} result not available yet (attempt ${attempt + 1}/${MAX_RETRIES})`,
            )
          }
        }

        // Transaction not yet sealed, wait and retry
        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
        }
      } catch (error) {
        // Log errors but continue retrying
        if (attempt % 10 === 0 || attempt === MAX_RETRIES - 1) {
          console.error(
            `❌ Error polling transaction ${transactionId} (attempt ${attempt + 1}/${MAX_RETRIES}):`,
            error instanceof Error ? error.message : String(error),
          )
        }
        if (attempt === MAX_RETRIES - 1) {
          throw error
        }
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL))
      }
    }

    throw new Error('Transaction did not seal within the expected time frame')
  }

  // Create an original painting on blockchain
  async createOriginal(
    name: string,
    description: string,
    thumbnail: string,
    price: number,
    artistAddress: string,
    metadata: Record<string, string>,
  ) {
    try {
      // console.log('📝 Creating original:', {
      //   name,
      //   description,
      //   thumbnail,
      //   price,
      //   artistAddress,
      //   metadata,
      // })

      // Convert metadata object to Flow's dictionary format {String: String}
      const metadataArray = Object.entries(metadata).map(([key, value]) => ({
        key: {
          type: 'String',
          value: key,
        },
        value: {
          type: 'String',
          value: value.toString(),
        },
      }))

      const requestBody = {
        code: scripts.createOriginal(
          MnemeContractAddress,
          MnemeContractName,
          MetadataViewsContractAddress,
          NonFungibleTokenContractAddress,
        ),
        arguments: [
          {
            type: 'String',
            value: name,
          },
          {
            type: 'String',
            value: description,
          },
          {
            type: 'String',
            value: thumbnail,
          },
          {
            type: 'UFix64',
            value: Number(price).toFixed(1),
          },
          {
            type: 'Address',
            value: artistAddress,
          },
          {
            type: 'Dictionary',
            value: metadataArray,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${MnemeContractAddress}/transactions`,
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

      // Extract transaction ID from response
      const transactionId =
        responseData.id ||
        responseData.transactionId ||
        responseData.txId ||
        responseData.transaction_id

      if (!transactionId) {
        return responseData
      }

      // Always return response with transactionId and jobId
      // The hook will handle polling asynchronously to get originalId
      // This prevents timeouts and ensures consistent behavior across all environments
      return responseData
    } catch (error) {
      console.error(error, `Error when trying to create original with the ArtDrop Collection`)
      throw error
    }
  }

  // Get originalId from transaction events (static method for use in hooks)
  static async getOriginalIdFromTransaction(transactionId: string): Promise<number | null> {
    try {
      console.log(
        `🔍 getOriginalIdFromTransaction: Starting to fetch events for transaction ${transactionId}`,
      )
      const adminService = new AdminService()
      // Use consistent timeout across all environments (10 minutes)
      const maxRetries = 300 // 10 minutes (300 attempts * 2 seconds)
      const events = await adminService.fetchTransactionEvents(transactionId, maxRetries)

      console.log(
        `📦 getOriginalIdFromTransaction: Received ${events.length} events, searching for OriginalCreated...`,
      )

      // Build event type for OriginalCreated
      const contractAddressHex = MnemeContractAddress?.replace('0x', '') || ''
      const expectedEventType = `A.${contractAddressHex}.${MnemeContractName}.OriginalCreated`

      // Find the OriginalCreated event
      const originalCreatedEvent = events.find(
        (event: DecodedFlowEvent | FlowEvent) =>
          event.type?.includes('OriginalCreated') || event.type === expectedEventType,
      )

      if (!originalCreatedEvent) {
        console.warn(
          `⚠️ getOriginalIdFromTransaction: OriginalCreated event not found. Available event types: ${events.map((e) => e.type).join(', ')}`,
        )
        return null
      }

      console.log(`✅ getOriginalIdFromTransaction: Found OriginalCreated event:`, {
        type: originalCreatedEvent.type,
        data: originalCreatedEvent.data,
        originalId: originalCreatedEvent.originalId,
      })

      const originalId =
        originalCreatedEvent.originalId ||
        originalCreatedEvent.data?.originalId ||
        originalCreatedEvent.data?.id

      if (!originalId) {
        console.warn(`⚠️ getOriginalIdFromTransaction: originalId not found in event data`)
        return null
      }

      // Convert to number if it's a string
      const finalOriginalId =
        typeof originalId === 'number' ? originalId : parseInt(String(originalId), 10)
      console.log(
        `✅ getOriginalIdFromTransaction: Successfully extracted originalId: ${finalOriginalId}`,
      )
      return finalOriginalId
    } catch (error) {
      console.error('❌ Error getting originalId from transaction:', error)
      return null
    }
  }

  // Get editionId from transaction events (static method for use in hooks)
  static async getEditionIdFromTransaction(transactionId: string): Promise<number | null> {
    try {
      console.log(
        `🔍 getEditionIdFromTransaction: Starting to fetch events for transaction ${transactionId}`,
      )
      const adminService = new AdminService()
      // Use consistent timeout across all environments (10 minutes)
      const maxRetries = 300 // 10 minutes (300 attempts * 2 seconds)
      const events = await adminService.fetchTransactionEvents(transactionId, maxRetries)

      console.log(
        `📦 getEditionIdFromTransaction: Received ${events.length} events, searching for EditionCreated...`,
      )

      // Build event type for EditionCreated
      const contractAddressHex = MnemeContractAddress?.replace('0x', '') || ''
      const expectedEventType = `A.${contractAddressHex}.${MnemeContractName}.EditionCreated`

      // Find the EditionCreated event
      const editionCreatedEvent = events.find(
        (event: DecodedFlowEvent | FlowEvent) =>
          event.type?.includes('EditionCreated') || event.type === expectedEventType,
      )

      if (!editionCreatedEvent) {
        console.warn(
          `⚠️ getEditionIdFromTransaction: EditionCreated event not found. Available event types: ${events.map((e) => e.type).join(', ')}`,
        )
        return null
      }

      console.log(`✅ getEditionIdFromTransaction: Found EditionCreated event:`, {
        type: editionCreatedEvent.type,
        data: editionCreatedEvent.data,
        editionId: editionCreatedEvent.editionId,
      })

      const editionId =
        editionCreatedEvent.editionId ||
        editionCreatedEvent.data?.editionId ||
        editionCreatedEvent.data?.id

      if (!editionId) {
        console.warn(`⚠️ getEditionIdFromTransaction: editionId not found in event data`)
        return null
      }

      // Convert to number if it's a string
      const finalEditionId =
        typeof editionId === 'number' ? editionId : parseInt(String(editionId), 10)
      console.log(
        `✅ getEditionIdFromTransaction: Successfully extracted editionId: ${finalEditionId}`,
      )
      return finalEditionId
    } catch (error) {
      console.error(
        `❌ getEditionIdFromTransaction: Error fetching editionId from transaction ${transactionId}:`,
        error,
      )
      throw error
    }
  }

  // Setup an account to hold an ArtDrop NFT
  async setupAccount(accountAddress: string) {
    try {
      const data = JSON.stringify({
        code: scripts.setupAccount(
          MnemeContractAddress,
          MnemeContractName,
          MetadataViewsContractAddress,
          NonFungibleTokenContractAddress,
        ),
      })
      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${accountAddress}/transactions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: data,
        },
      )
      return response
    } catch (error) {
      console.error(
        error,
        `Error when trying to setup account:${accountAddress} with the ArtDrop Collection`,
      )
      return error
    }
  }

  // Create an edition of a certificate
  async createEdition(
    originalId: number,
    name: string,
    price: number,
    type: string,
    story: string,
    dimensions: { height: number; width: number; weight: number },
    reprintLimit: number,
    artistAddress: string,
    multipliers: number[],
    profitSplitAddresses: string[],
    profitSplitPercentages: number[],
  ) {
    try {
      console.log('📝 Creating edition:', {
        originalId,
        name,
        price,
        type,
        story,
        dimensions,
        reprintLimit,
        artistAddress,
        multipliers,
        profitSplitAddresses,
        profitSplitPercentages,
      })

      // Convert dimensions object to Flow's dictionary format {String: String}
      // Flow dictionaries must be arrays of key-value pairs
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

      // Convert multipliers array to Flow's Array format [UFix64]
      // Flow arrays must be arrays of values with their types
      const multipliersArray = multipliers.map((value) => ({
        type: 'UFix64',
        value: Number(value).toFixed(1),
      }))

      // Convert profitSplitAddresses array to Flow's Array format [Address]
      const profitSplitAddressesArray = profitSplitAddresses.map((address) => ({
        type: 'Address',
        value: address,
      }))

      // Convert profitSplitPercentages array to Flow's Array format [UFix64]
      const profitSplitPercentagesArray = profitSplitPercentages.map((percentage) => ({
        type: 'UFix64',
        value: Number(percentage).toFixed(1),
      }))

      const requestBody = {
        code: scripts.createEdition(
          MnemeContractAddress,
          MnemeContractName,
          MetadataViewsContractAddress,
          NonFungibleTokenContractAddress,
        ),
        arguments: [
          {
            type: 'UInt64',
            value: originalId.toString(),
          },
          {
            type: 'String',
            value: name,
          },
          {
            type: 'UFix64',
            value: Number(price).toFixed(1),
          },
          {
            type: 'String',
            value: type,
          },
          {
            type: 'String',
            value: story,
          },
          {
            type: 'Dictionary',
            value: dimensionsArray,
          },
          {
            type: 'Int64',
            value: reprintLimit.toString(),
          },
          {
            type: 'Address',
            value: artistAddress,
          },
          {
            type: 'Array',
            value: multipliersArray,
          },
          {
            type: 'Array',
            value: profitSplitAddressesArray,
          },
          {
            type: 'Array',
            value: profitSplitPercentagesArray,
          },
        ],
      }

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${MnemeContractAddress}/transactions`,
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

      // Extract transaction ID from response
      // Try common field names: id, transactionId, txId, transaction_id
      const transactionId =
        responseData.id ||
        responseData.transactionId ||
        responseData.txId ||
        responseData.transaction_id

      if (!transactionId) {
        return responseData
      }

      // Always return response with transactionId and jobId
      // The hook will handle polling asynchronously to get editionId
      // This prevents timeouts and ensures consistent behavior across all environments
      return responseData
    } catch (error) {
      throw error
    }
  }

  // Edit edition rules
  async editEditionRules(
    editionID: number,
    artistAddress: string,
    name?: string,
    price?: number,
    type?: string,
    story?: string,
    dimensions?: { height: number; width: number; weight: number },
    reprintLimit?: number,
  ) {
    try {
      console.log('📝 Editing edition rules:', {
        editionID,
        artistAddress,
        name,
        price,
        type,
        story,
        dimensions,
        reprintLimit,
      })

      // Build arguments array - editionID and artistAddress are required
      type FlowArgumentValue =
        | string
        | number
        | {
            type: string
            value:
              | string
              | number
              | Array<{
                  key: { type: string; value: string }
                  value: { type: string; value: string }
                }>
          }
        | null

      const argumentsArray: Array<{
        type: string
        value: FlowArgumentValue
      }> = [
        {
          type: 'UInt64',
          value: editionID.toString(),
        },
        {
          type: 'Address',
          value: artistAddress,
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
        code: scripts.editEditionRules(MnemeContractAddress, MnemeContractName),
        arguments: argumentsArray,
      }

      console.log(
        '📤 Sending editEditionRules transaction with arguments:',
        JSON.stringify(requestBody.arguments, null, 2),
      )

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${MnemeContractAddress}/transactions`,
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
          // Use the existing fetchTransactionEvents method which already handles polling
          const _events = await this.fetchTransactionEvents(transactionId)

          // Check transaction status by fetching it directly
          const verificationUrl = getFlowVerificationUrl()
          const statusResponse = await fetch(
            `${verificationUrl}/v1/transactions/${transactionId}?expand=result`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )

          if (statusResponse.ok) {
            const transactionData = await statusResponse.json()
            const result = transactionData.result

            if (result) {
              const statusCode = result.status_code
              const execution = result.execution

              // Check if transaction failed
              if (statusCode !== 0 || execution !== 'Success') {
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
                  transactionStatus: result.status,
                  transactionStatusCode: statusCode,
                }
              }
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
        `Error when trying to edit edition rules for editionID:${editionID} with the ArtDrop Collection`,
      )
      throw error
    }
  }

  // Update multipliers for an edition
  async updateMultipliers(editionID: number, artistAddress: string, multipliers: number[]) {
    try {
      console.log('📊 Updating multipliers:', {
        editionID,
        artistAddress,
        multipliers,
      })

      // Convert multipliers array to Flow's array format
      const multipliersArray = multipliers.map((multiplier) => ({
        type: 'UFix64',
        value: Number(multiplier).toFixed(1),
      }))

      const argumentsArray: Array<{
        type: string
        value: string | number | Array<{ type: string; value: string }>
      }> = [
        {
          type: 'UInt64',
          value: editionID.toString(),
        },
        {
          type: 'Address',
          value: artistAddress,
        },
        {
          type: 'Array',
          value: multipliersArray,
        },
      ]

      const requestBody = {
        code: scripts.updateMultipliers(MnemeContractAddress, MnemeContractName),
        arguments: argumentsArray,
      }

      console.log(
        '📤 Sending updateMultipliers transaction with arguments:',
        JSON.stringify(requestBody.arguments, null, 2),
      )

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${MnemeContractAddress}/transactions`,
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
          // Use the existing fetchTransactionEvents method which already handles polling
          const _events = await this.fetchTransactionEvents(transactionId)

          // Check transaction status by fetching it directly
          const verificationUrl = getFlowVerificationUrl()
          const statusResponse = await fetch(
            `${verificationUrl}/v1/transactions/${transactionId}?expand=result`,
            {
              method: 'GET',
              headers: {
                'Content-Type': 'application/json',
              },
            },
          )

          if (statusResponse.ok) {
            const transactionData = await statusResponse.json()
            const result = transactionData.result

            if (result) {
              const statusCode = result.status_code
              const execution = result.execution

              // Check if transaction failed
              if (statusCode !== 0 || execution !== 'Success') {
                // Extract error message from transaction result
                let errorMessage = 'Transaction failed'

                if (result.error_message) {
                  errorMessage = result.error_message
                } else if (result.errorMessage) {
                  errorMessage = result.errorMessage
                } else if (result.logs && Array.isArray(result.logs) && result.logs.length > 0) {
                  // Look for error messages in logs
                  const errorLog = result.logs.find(
                    (log: string) =>
                      log.toLowerCase().includes('error') || log.toLowerCase().includes('panic'),
                  )
                  if (errorLog) {
                    errorMessage = errorLog
                  }
                } else if (result.execution?.error?.message) {
                  errorMessage = result.execution.error.message
                }

                // Clean up the error message
                const cleanedErrorMessage = cleanFlowErrorMessage(errorMessage)

                // Return response with error information
                return {
                  ...responseData,
                  error: cleanedErrorMessage,
                  transactionStatus: result.status,
                  transactionStatusCode: statusCode,
                }
              }
            }
          }
        } catch (pollError) {
          // If polling fails, still return the original response
          console.warn('⚠️ Failed to poll transaction status:', pollError)
        }
      }

      return {
        ...responseData,
        transactionId,
      }
    } catch (error) {
      console.error(
        error,
        `Error when trying to update multipliers for editionId:${editionID} with artist:${artistAddress}`,
      )
      throw error
    }
  }

  // Admin mint certificate NFT
  async adminMintCertificate(artistAddress: string, editionId: number, thumbnail: string) {
    try {
      console.log('📝 Admin minting certificate:', {
        artistAddress,
        editionId,
        thumbnail,
      })

      const requestBody = {
        code: scripts.adminMintCertificate(MnemeContractAddress, MnemeContractName),
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

      console.log(
        '📤 Sending adminMintCertificate transaction with arguments:',
        JSON.stringify(requestBody.arguments, null, 2),
      )

      const data = JSON.stringify(requestBody)

      // make post request to blockchain API
      const response = await fetch(
        `${env.BLOCKCHAIN_API_URL}/v1/accounts/${MnemeContractAddress}/transactions`,
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

      // Try to enrich response with certificateId from Minted event
      const transactionId =
        responseData.id ||
        responseData.transactionId ||
        responseData.txId ||
        responseData.transaction_id

      if (!transactionId) {
        return responseData
      }

      try {
        const events = await this.fetchTransactionEvents(transactionId)

        const mintedEvent = events.find(
          (event: { type?: string }) =>
            event.type?.includes('Minted') ||
            event.type === this.buildEventType('Minted') ||
            event.type?.includes('CertificateMinted'),
        )

        if (!mintedEvent) {
          return responseData
        }

        const certificateId =
          mintedEvent.certificateId ||
          mintedEvent.data?.certificateId ||
          mintedEvent.data?.id ||
          mintedEvent.data?.tokenId

        if (!certificateId) {
          return responseData
        }

        return {
          ...responseData,
          certificateId,
        }
      } catch (eventError) {
        console.error('❌ Error fetching mint transaction events:', eventError)
        return responseData
      }
    } catch (error) {
      console.error(
        error,
        `Error when trying to admin mint certificate for editionId:${editionId} with the ArtDrop Collection`,
      )
      throw error
    }
  }
}

const adminService = new AdminService()
export default adminService
export { AdminService }

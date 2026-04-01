import { recordEntry as recordEntryScript } from './scripts/record_entry'

const BLOCKCHAIN_API_URL = process.env.BLOCKCHAIN_API_URL
const LIBRARIAN_ADDRESS =
  process.env.LIBRARIAN_ADDRESS || '0x6d96bf7d95a8b595'

export type EntryType = 'memory' | 'conversation' | 'reference' | 'note'

export interface RecordEntryParams {
  entryType: EntryType
  content: string
  metadata?: Record<string, string>
}

export interface RecordEntryResult {
  transactionId?: string
  status?: string
  error?: string
}

class LibrarianFlowService {
  async recordEntry(params: RecordEntryParams): Promise<RecordEntryResult> {
    const { entryType, content, metadata = {} } = params

    if (!BLOCKCHAIN_API_URL) {
      throw new Error('BLOCKCHAIN_API_URL is not configured')
    }

    const validTypes: EntryType[] = ['memory', 'conversation', 'reference', 'note']
    if (!validTypes.includes(entryType)) {
      throw new Error(
        `Invalid entryType: ${entryType}. Must be one of: ${validTypes.join(', ')}`
      )
    }

    const metadataArray = Object.entries(metadata).map(([key, value]) => ({
      key: { type: 'String', value: key },
      value: { type: 'String', value: String(value) },
    }))

    const requestBody = {
      code: recordEntryScript(LIBRARIAN_ADDRESS),
      arguments: [
        { type: 'String', value: entryType },
        { type: 'String', value: content },
        { type: 'Dictionary', value: metadataArray },
      ],
    }

    try {
      const baseUrl = BLOCKCHAIN_API_URL.replace(/\/$/, '')
      const url = `${baseUrl}/v1/accounts/${LIBRARIAN_ADDRESS}/transactions?sync=1`
      console.log('[LibrarianFlowService] POST', url)
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      const responseText = await response.text()
      let data: Record<string, unknown> = {}
      try {
        data = JSON.parse(responseText) as Record<string, unknown>
      } catch {
        console.error('[LibrarianFlowService] Response not JSON:', responseText.slice(0, 200))
      }

      if (!response.ok) {
        console.error('[LibrarianFlowService] Blockchain API error:', {
          status: response.status,
          body: responseText.slice(0, 500),
        })
        return {
          error: `Blockchain API error: ${response.status} - ${responseText.slice(0, 200)}`,
        }
      }

      console.log('[LibrarianFlowService] Response:', JSON.stringify(data).slice(0, 300))

      const transactionId =
        (data.transactionId as string) ||
        (data.id as string) ||
        (data.txId as string) ||
        (data.transaction_id as string) ||
        (data.result as string)

      return {
        transactionId,
        status: (data.status as string) || (data.state as string) || 'pending',
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error('[LibrarianFlowService] recordEntry failed:', err)
      return { error: message }
    }
  }
}

const librarianFlowService = new LibrarianFlowService()
export default librarianFlowService

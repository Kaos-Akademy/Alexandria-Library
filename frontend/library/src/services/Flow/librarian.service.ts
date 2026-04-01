import { fcl } from '@/lib/flowFclConfig'
import { recordEntry as recordEntryScript } from './scripts/record_entry'
import { setNameTransaction } from './scripts/set_name'
import { getLibrarianContextScript } from './scripts/get_librarian_context'

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

export interface SetNameResult {
  transactionId?: string
  status?: string
  error?: string
}

export interface JournalEntry {
  entryType: string
  content: string
  metadata: Record<string, string>
  timestamp: string
}

export interface GetJournalResult {
  entries?: JournalEntry[]
  error?: string
}

export interface GetLibrarianNameResult {
  name?: string
  error?: string
}

export interface LibrarianContextData {
  name: string
  missionStatement: string
  entries: JournalEntry[]
}

export interface GetLibrarianContextResult extends LibrarianContextData {
  error?: string
}

function pickStr(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k]
    if (typeof v === 'string') return v
  }
  return ''
}

function toJournalEntry(raw: unknown): JournalEntry {
  const o = raw as Record<string, unknown>
  const entryType = String(o?.entryType ?? 'note').toLowerCase()
  const content = String(o?.content ?? '')
  const meta = o?.metadata
  const metadata: Record<string, string> =
    meta && typeof meta === 'object' && !Array.isArray(meta)
      ? Object.fromEntries(
          Object.entries(meta as Record<string, unknown>).map(([k, v]) => [
            k,
            String(v ?? ''),
          ])
        )
      : {}
  const timestamp = String(o?.timestamp ?? '0')
  return { entryType, content, metadata, timestamp }
}

function parseLibrarianContext(raw: unknown): LibrarianContextData {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return { name: '', missionStatement: '', entries: [] }
  }
  const o = raw as Record<string, unknown>
  const journalRaw = o.journal ?? o.Journal
  const arr = Array.isArray(journalRaw) ? journalRaw : []
  return {
    name: pickStr(o, 'name', 'Name'),
    missionStatement: pickStr(o, 'missionStatement', 'MissionStatement'),
    entries: arr.map(toJournalEntry),
  }
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

  async setName(newName: string): Promise<SetNameResult> {
    const trimmed = newName.trim()
    if (!trimmed) {
      return { error: 'Name cannot be empty' }
    }
    if (!BLOCKCHAIN_API_URL) {
      throw new Error('BLOCKCHAIN_API_URL is not configured')
    }

    const requestBody = {
      code: setNameTransaction(LIBRARIAN_ADDRESS),
      arguments: [{ type: 'String', value: trimmed }],
    }

    try {
      const baseUrl = BLOCKCHAIN_API_URL.replace(/\/$/, '')
      const url = `${baseUrl}/v1/accounts/${LIBRARIAN_ADDRESS}/transactions?sync=1`
      console.log('[LibrarianFlowService] setName POST', url)
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
        console.error('[LibrarianFlowService] setName response not JSON:', responseText.slice(0, 200))
      }

      if (!response.ok) {
        console.error('[LibrarianFlowService] setName Blockchain API error:', {
          status: response.status,
          body: responseText.slice(0, 500),
        })
        return {
          error: `Blockchain API error: ${response.status} - ${responseText.slice(0, 200)}`,
        }
      }

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
      console.error('[LibrarianFlowService] setName failed:', err)
      return { error: message }
    }
  }

  /**
   * Single Flow script: name, missionStatement (on-chain "consciousness"), and journal.
   */
  async getLibrarianContext(limit: number = 10): Promise<GetLibrarianContextResult> {
    const clamped = Math.max(0, Math.min(Math.floor(limit), 100))
    try {
      const response = await fcl.query({
        cadence: getLibrarianContextScript(LIBRARIAN_ADDRESS),
        args: (arg, t) => [arg(String(clamped), t.Int)],
      })
      return parseLibrarianContext(response)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      return {
        name: '',
        missionStatement: '',
        entries: [],
        error: msg,
      }
    }
  }

  async getJournal(limit: number = 10): Promise<GetJournalResult> {
    const clamped = Math.max(1, Math.min(Math.floor(limit), 100))
    const ctx = await this.getLibrarianContext(clamped)
    if (ctx.error) {
      return { error: ctx.error, entries: [] }
    }
    return { entries: ctx.entries }
  }

  async getLibrarianName(): Promise<GetLibrarianNameResult> {
    const ctx = await this.getLibrarianContext(0)
    if (ctx.error) {
      return { error: ctx.error }
    }
    return { name: ctx.name }
  }
}

const librarianFlowService = new LibrarianFlowService()
export default librarianFlowService

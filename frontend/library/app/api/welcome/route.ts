import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { LIBRARIAN_SYSTEM_PROMPT } from '@/lib/librarianKnowledge'
import librarianFlowService from '@/services/Flow/librarian.service'
import { fetchLibraryStats, fetchRandomQuote } from '@/flow/actions'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 15

function getModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'auto'
  const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const hasXai = !!process.env.XAI_API_KEY
  if (provider === 'grok' || provider === 'xai') {
    if (!hasXai) throw new Error('XAI_API_KEY required')
    return xai(process.env.GROK_MODEL || 'grok-4-1-fast-reasoning')
  }
  if (provider === 'google') {
    if (!hasGoogle) throw new Error('GOOGLE_GENERATIVE_AI_API_KEY required')
    return google('gemini-2.0-flash')
  }
  if (hasXai) return xai(process.env.GROK_MODEL || 'grok-4-1-fast-reasoning')
  if (hasGoogle) return google('gemini-2.0-flash')
  throw new Error('Set XAI_API_KEY or GOOGLE_GENERATIVE_AI_API_KEY')
}

const WELCOME_PROMPT = `Generate a brief, warm welcome message for a visitor to the Alexandria Library chat. You are the AI Librarian.

Requirements:
- 2–4 sentences max
- Be personal and varied — never generic
- Use your journal and library stats below to make it specific
- If a quote from a book is provided below, weave it naturally into your welcome (e.g. open with it, or reference it)
- When natural, briefly mention they can contribute at /contribute to support the library
- Sound like a guardian of knowledge welcoming someone
- Do NOT use markdown, lists, or formatting
- Output ONLY the welcome message, nothing else`

export async function GET() {
  try {
    const model = getModel()
    const [contextResult, stats, quoteResult] = await Promise.all([
      librarianFlowService.getLibrarianContext(100),
      fetchLibraryStats(),
      fetchRandomQuote(),
    ])
    const journalEntries = contextResult.entries ?? []
    const journalMemory =
      journalEntries.length > 0
        ? journalEntries
            .map(
              (e) =>
                `- [${e.entryType}] ${e.timestamp ? new Date(Number(e.timestamp) * 1000).toISOString().slice(0, 10) : ''}: ${e.content}`
            )
            .join('\n')
        : 'No entries yet.'
    const statsBlob =
      stats.books > 0 || stats.authors > 0 || stats.genres > 0
        ? `${stats.books} books, ${stats.authors} authors, ${stats.genres} genres. Sample books: ${(stats.bookTitles ?? []).slice(0, 5).join(', ') || 'none'}`
        : 'Library catalog is being built.'

    const quoteBlob =
      quoteResult?.quote && quoteResult.bookTitle
        ? `Quote to weave into your welcome (from "${quoteResult.bookTitle}"${quoteResult.author ? ` by ${quoteResult.author}` : ''}):\n"${quoteResult.quote}"`
        : 'No quote available.'

    const identityBlob = contextResult.error
      ? ''
      : `## Your on-chain identity (Flow)
**Name:** ${contextResult.name?.trim() || '(not set yet)'}
**Mission:** ${contextResult.missionStatement}

`

    const systemPrompt = `${LIBRARIAN_SYSTEM_PROMPT}
${identityBlob}## Your Memory (on-chain journal)
\`\`\`
${journalMemory}
\`\`\`

## Library state (right now)
${statsBlob}

## Quote from the collection
${quoteBlob}`

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: WELCOME_PROMPT,
      maxOutputTokens: 150,
    })

    const welcome = (text || 'Welcome to the Alexandria Library. How can I help you today?').trim()
    return NextResponse.json({ welcome })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Welcome]', msg)
    return NextResponse.json(
      { welcome: 'Welcome to the Alexandria Library. How can I help you today?' },
      { status: 200 }
    )
  }
}

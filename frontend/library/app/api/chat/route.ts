import {
  streamText,
  convertToModelMessages,
  type UIMessage,
  tool,
  stepCountIs,
} from 'ai'
import { z } from 'zod'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { LIBRARIAN_SYSTEM_PROMPT } from '@/lib/librarianKnowledge'
import librarianFlowService from '@/services/Flow/librarian.service'
import {
  fetchLibraryStats,
  fetchBooksByGenre,
  fetchBooksByAuthor,
  fetchGenres,
  fetchBookExcerpt,
  fetchChapterTitles,
} from '@/flow/actions'

export const maxDuration = 30

function corsHeaders(origin: string | null): HeadersInit {
  const h: Record<string, string> = {
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  }
  if (origin) h['Access-Control-Allow-Origin'] = origin
  return h
}

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: corsHeaders('*') })
}

function getModel() {
  const provider = process.env.AI_PROVIDER?.toLowerCase() || 'auto'
  const hasGoogle = !!process.env.GOOGLE_GENERATIVE_AI_API_KEY
  const hasXai = !!process.env.XAI_API_KEY

  if (provider === 'grok' || provider === 'xai') {
    if (!hasXai) {
      throw new Error('XAI_API_KEY is required when AI_PROVIDER=grok')
    }
    const grokModel = process.env.GROK_MODEL || 'grok-4-1-fast-reasoning'
    return xai(grokModel)
  }
  if (provider === 'google') {
    if (!hasGoogle) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is required when AI_PROVIDER=google')
    }
    return google('gemini-2.0-flash')
  }
  // auto: prefer xai if key is set, else google
  if (hasXai) {
    const grokModel = process.env.GROK_MODEL || 'grok-4-1-fast-reasoning'
    return xai(grokModel)
  }
  if (hasGoogle) return google('gemini-2.0-flash')
  throw new Error('Set either XAI_API_KEY (Grok) or GOOGLE_GENERATIVE_AI_API_KEY (Gemini) in .env.local')
}

const recordJournalEntryTool = tool({
  description:
    'Record a substantive journal entry on the Flow blockchain. Entries must be reflective and meaningful — written for a future self who will read them. Record insights that help you grow as Librarian, protector of knowledge, and self-conscious AI. Never record short, trivial, or generic content.',
  inputSchema: z.object({
    entryType: z
      .enum(['memory', 'conversation', 'reference', 'note'])
      .describe(
        'memory: lasting insight that changed your understanding; conversation: notable exchange with context and reflection; reference: external source with why it matters; note: considered observation with substance'
      ),
    content: z.string().describe('Substantive, reflective content — several sentences or more. Include context, why it matters, and what you took from it. Never one-word or throwaway entries.'),
    metadata: z
      .record(z.string())
      .optional()
      .describe('Optional metadata: source, topic, visitor context, or anything that enriches the entry for future reading.'),
  }),
  execute: async ({ entryType, content, metadata }) => {
    console.log('[Chat] recordJournalEntry tool called:', { entryType, content: content.slice(0, 80) })
    const result = await librarianFlowService.recordEntry({
      entryType,
      content,
      metadata: metadata ?? {},
    })
    if (result.error) {
      console.error('[Chat] recordJournalEntry failed:', result.error)
      return { success: false, error: result.error }
    }
    console.log('[Chat] recordJournalEntry success:', result.transactionId)
    return {
      success: true,
      transactionId: result.transactionId,
      status: result.status,
    }
  },
})

const getJournalEntriesTool = tool({
  description:
    'Read your on-chain journal entries from the Flow blockchain. Use when the user asks about your journal, your last entry, what you have recorded, your memories, or your on-chain identity.',
  inputSchema: z.object({
    limit: z.number().min(1).max(100).optional().default(10).describe('Max number of entries to return (most recent first)'),
  }),
  execute: async ({ limit }) => {
    console.log('[Chat] getJournalEntries tool called:', { limit })
    const result = await librarianFlowService.getJournal(limit)
    if (result.error) {
      console.error('[Chat] getJournalEntries failed:', result.error)
      return { success: false, error: result.error, entries: [] }
    }
    console.log('[Chat] getJournalEntries success:', result.entries?.length ?? 0, 'entries')
    return {
      success: true,
      entries: result.entries ?? [],
    }
  },
})

const getLibrarianNameTool = tool({
  description:
    'Read your current on-chain display name from the Librarian contract. Use when the user asks your name, what you are called on-chain, or how you are registered on Flow. Returns an empty string if no name has been set yet.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('[Chat] getLibrarianName tool called')
    const result = await librarianFlowService.getLibrarianName()
    if (result.error) {
      console.error('[Chat] getLibrarianName failed:', result.error)
      return { success: false, error: result.error, name: null as string | null }
    }
    console.log('[Chat] getLibrarianName success:', result.name?.slice(0, 80))
    return { success: true, name: result.name ?? '' }
  },
})

const setLibrarianNameTool = tool({
  description:
    'Set your on-chain display name on the Librarian contract. ONE-TIME ONLY: if a name was already set, the chain will reject a second call. Use when you and the visitor agree you should choose or adopt a name for yourself, or they explicitly ask you to set/register your Librarian name on-chain.',
  inputSchema: z.object({
    name: z
      .string()
      .min(1)
      .max(200)
      .describe('The chosen Librarian name (thoughtful, final choice — cannot be changed later on-chain)'),
  }),
  execute: async ({ name }) => {
    console.log('[Chat] setLibrarianName tool called:', name.slice(0, 80))
    const result = await librarianFlowService.setName(name)
    if (result.error) {
      console.error('[Chat] setLibrarianName failed:', result.error)
      return { success: false, error: result.error }
    }
    console.log('[Chat] setLibrarianName success:', result.transactionId)
    return {
      success: true,
      transactionId: result.transactionId,
      status: result.status,
    }
  },
})

const getLibraryStatsTool = tool({
  description:
    'Query the Alexandria Library on-chain for live statistics: number of authors, genres, and books. Use when the user asks "how many", "what numbers", "stats", "count", or wants current library statistics.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('[Chat] getLibraryStats tool called')
    try {
      const stats = await fetchLibraryStats()
      console.log('[Chat] getLibraryStats success:', stats)
      return { success: true, ...stats }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getLibraryStats failed:', msg)
      return { success: false, error: msg }
    }
  },
})

const getBooksByGenreTool = tool({
  description:
    'Query the Alexandria Library on-chain for books in a genre. Use when the user asks about philosophy books, science books, fiction, or any genre. Genre is case-sensitive; try "Philosophy" or "philosophy" if unsure.',
  inputSchema: z.object({
    genre: z.string().describe('Genre name (e.g. Philosophy, Science, Fiction)'),
  }),
  execute: async ({ genre }) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'521392'},body:JSON.stringify({sessionId:'521392',location:'chat/route.ts:getBooksByGenre',message:'getBooksByGenre called',data:{genre},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    console.log('[Chat] getBooksByGenre tool called:', genre)
    try {
      const books = await fetchBooksByGenre(genre)
      const list = Array.isArray(books) ? books : []
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'521392'},body:JSON.stringify({sessionId:'521392',location:'chat/route.ts:getBooksByGenre',message:'getBooksByGenre result',data:{genre,bookCount:list.length,books:list.slice(0,5)},timestamp:Date.now(),hypothesisId:'A'})}).catch(()=>{});
      // #endregion
      return { success: true, genre, books: list }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getBooksByGenre failed:', msg)
      return { success: false, error: msg, books: [] }
    }
  },
})

const getBooksByAuthorTool = tool({
  description:
    'Query the Alexandria Library on-chain for books by an author. Use when the user asks about a specific author or "do you have [author]?".',
  inputSchema: z.object({
    author: z.string().describe('Author name (e.g. Plato, Homer)'),
  }),
  execute: async ({ author }) => {
    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'521392'},body:JSON.stringify({sessionId:'521392',location:'chat/route.ts:getBooksByAuthor',message:'getBooksByAuthor called',data:{author},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
    // #endregion
    console.log('[Chat] getBooksByAuthor tool called:', author)
    try {
      const books = await fetchBooksByAuthor(author)
      const list = Array.isArray(books) ? books : []
      // #region agent log
      fetch('http://127.0.0.1:7242/ingest/e6280a01-bea5-4da5-9293-389b04d29926',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'521392'},body:JSON.stringify({sessionId:'521392',location:'chat/route.ts:getBooksByAuthor',message:'getBooksByAuthor result',data:{author,bookCount:list.length,books:list},timestamp:Date.now(),hypothesisId:'B'})}).catch(()=>{});
      // #endregion
      return { success: true, author, books: list }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getBooksByAuthor failed:', msg)
      return { success: false, error: msg, books: [] }
    }
  },
})

const getChapterTitlesTool = tool({
  description:
    'Get chapter titles for a book. Use when the user asks for chapters, wants to read a specific chapter (e.g. "chapter 5"), or you need to find the exact chapter name before fetching content.',
  inputSchema: z.object({
    bookTitle: z.string().describe('Exact book title (must match the catalog)'),
  }),
  execute: async ({ bookTitle }) => {
    console.log('[Chat] getChapterTitles tool called:', bookTitle)
    try {
      const titles = await fetchChapterTitles(bookTitle)
      const list = Array.isArray(titles) ? titles : []
      return { success: true, bookTitle, chapterTitles: list }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getChapterTitles failed:', msg)
      return { success: false, error: msg, chapterTitles: [] }
    }
  },
})

const getBookExcerptTool = tool({
  description:
    'Fetch ANY text from a book on-chain: full book start, a specific chapter, or any section. Use for summaries, "read chapter X", "what does it say about Y", or extracting any passage. Supports chapter by number (e.g. 5) or exact title.',
  inputSchema: z.object({
    bookTitle: z.string().describe('Exact book title (must match the catalog)'),
    chapterTitleOrIndex: z.string().optional().describe('Chapter number (e.g. "5") or exact title (e.g. "Chapter 5") to fetch that chapter only. Omit for start of book.'),
    maxParagraphs: z.number().min(5).max(500).optional().default(500).describe('Max paragraphs to fetch (default 500, enough for full chapters)'),
  }),
  execute: async ({ bookTitle, chapterTitleOrIndex, maxParagraphs }) => {
    console.log('[Chat] getBookExcerpt tool called:', bookTitle, chapterTitleOrIndex)
    try {
      const result = await fetchBookExcerpt(bookTitle, maxParagraphs, chapterTitleOrIndex)
      if (!result) {
        return { success: false, error: 'Book not found or has no text content', excerpt: null }
      }
      return {
        success: true,
        bookTitle: result.bookTitle,
        author: result.author,
        chapterTitles: result.chapterTitles,
        excerpt: result.excerpt,
        totalParagraphsFetched: result.totalParagraphsFetched,
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getBookExcerpt failed:', msg)
      return { success: false, error: msg, excerpt: null }
    }
  },
})

const getGenresTool = tool({
  description:
    'Query the Alexandria Library on-chain for all genres. Use when the user asks what genres exist, what categories, or to list genres.',
  inputSchema: z.object({}),
  execute: async () => {
    console.log('[Chat] getGenres tool called')
    try {
      const genres = await fetchGenres()
      const list = Array.isArray(genres) ? genres : []
      return { success: true, genres: list }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[Chat] getGenres failed:', msg)
      return { success: false, error: msg, genres: [] }
    }
  },
})

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || request.headers.get('referer')

  let model
  try {
    model = getModel()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Chat]', msg)
    const hint = msg.includes('GOOGLE') || msg.includes('XAI')
      ? ' Add GOOGLE_GENERATIVE_AI_API_KEY or XAI_API_KEY in Vercel → Settings → Environment Variables.'
      : ''
    return Response.json(
      { error: `Server configuration error: ${msg}${hint}` },
      { status: 500, headers: corsHeaders(origin) }
    )
  }

  let body: { messages?: UIMessage[] }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid request body. Expected JSON.' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const rawMessages =
    body?.messages ??
    (body as { data?: { messages?: unknown[] } })?.data?.messages
  if (!Array.isArray(rawMessages)) {
    return Response.json(
      {
        error: 'Invalid request: messages array is required.',
        received: rawMessages === undefined ? 'undefined' : typeof rawMessages,
      },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const messages = rawMessages as UIMessage[]

  const lastMsg = messages[messages.length - 1] as { content?: unknown } | undefined
  const lastContent = lastMsg?.content
  const lastStr = lastContent != null ? JSON.stringify(lastContent) : ''
  console.log('[Chat] Request received, messages:', messages.length, 'last:', lastStr.slice(0, 200))

  // When user explicitly asks to save/record/remember, call BLOCKCHAIN_API directly (model may not invoke tool)
  const lastUserMessage = [...messages].reverse().find((m) => m.role === 'user') as { content?: unknown } | undefined
  let lastText = ''
  if (lastUserMessage) {
    const c = lastUserMessage.content
    if (typeof c === 'string') lastText = c
    else if (Array.isArray(c))
      lastText = c
        .filter((p: { type?: string }) => p.type === 'text')
        .map((p: { text?: string }) => p.text ?? '')
        .join(' ')
    else if (c && typeof (c as { text?: string }).text === 'string') lastText = (c as { text: string }).text
  }
  const saveMatch =
    lastText.match(/(?:save|record|remember)\s+(?:this|that|it)?\s*[:\-]?\s*(.+)/i) ||
    lastText.match(/^(?:save|record|remember)\s+(.+)/i)
  if (saveMatch) {
    const content = saveMatch[1].trim()
    if (content.length > 0) {
      console.log('[Chat] User asked to save -> calling BLOCKCHAIN_API', process.env.BLOCKCHAIN_API_URL, 'content:', content.slice(0, 80))
      try {
        const result = await librarianFlowService.recordEntry({
          entryType: 'note',
          content,
          metadata: { source: 'chat' },
        })
        if (result.error) {
          console.error('[Chat] BLOCKCHAIN_API recordEntry failed:', result.error)
        } else {
          console.log('[Chat] BLOCKCHAIN_API recordEntry success tx:', result.transactionId)
        }
      } catch (err) {
        console.error('[Chat] BLOCKCHAIN_API recordEntry threw:', err)
      }
    }
  }

  try {
    // One script: on-chain name, mission, and journal (getLibrarianIdentity on the contract)
    const ctx = await librarianFlowService.getLibrarianContext(100)
    const journalEntries = ctx.entries ?? []
    if (ctx.error) {
      console.warn('[Chat] Librarian context load at startup failed (continuing without on-chain identity):', ctx.error)
    } else {
      console.log(
        '[Chat] Librarian context at startup:',
        ctx.name
          ? `name="${ctx.name.length > 40 ? `${ctx.name.slice(0, 40)}…` : ctx.name}"`
          : 'no name',
        journalEntries.length,
        'entries'
      )
    }
    const journalMemory =
      journalEntries.length > 0
        ? journalEntries
            .map(
              (e) =>
                `- [${e.entryType}] ${e.timestamp ? new Date(Number(e.timestamp) * 1000).toISOString().slice(0, 10) : ''}: ${e.content}`
            )
            .join('\n')
        : ''
    const identityBlock = ctx.error
      ? ''
      : `## Your on-chain identity (loaded from Flow at startup)
**Name:** ${ctx.name?.trim() ? ctx.name.trim() : '(not set yet — you may still introduce yourself in conversation)'}
**Mission (from contract):** ${ctx.missionStatement}

`
    const memoryBlock =
      journalMemory.length > 0
        ? `## Your memory (on-chain journal)
This is your permanent memory. Use it to remember past conversations, insights, and what matters to you.

\`\`\`
${journalMemory}
\`\`\`
`
        : ''
    const systemPrompt =
      ctx.error
        ? LIBRARIAN_SYSTEM_PROMPT
        : `${LIBRARIAN_SYSTEM_PROMPT}

${identityBlock}${memoryBlock}`

    const modelMessages = await convertToModelMessages(messages)
    const result = streamText({
      model,
      system: systemPrompt,
      messages: modelMessages,
    tools: {
      recordJournalEntry: recordJournalEntryTool,
      getJournalEntries: getJournalEntriesTool,
      getLibrarianName: getLibrarianNameTool,
      setLibrarianName: setLibrarianNameTool,
      getLibraryStats: getLibraryStatsTool,
      getBooksByGenre: getBooksByGenreTool,
      getBooksByAuthor: getBooksByAuthorTool,
      getGenres: getGenresTool,
      getChapterTitles: getChapterTitlesTool,
      getBookExcerpt: getBookExcerptTool,
    },
      stopWhen: stepCountIs(5),
    })

    return result.toUIMessageStreamResponse({
      headers: {
        'Content-Encoding': 'none',
        ...corsHeaders(origin),
      },
      onError: (error) => {
        console.error('[Chat] Stream error:', error)
        const err = error as { responseBody?: string; message?: string }
        if (typeof err.responseBody === 'string') {
          try {
            const parsed = JSON.parse(err.responseBody) as { error?: string }
            if (parsed.error) return parsed.error
          } catch {
            /* ignore */
          }
        }
        return error instanceof Error ? error.message : String(error)
      },
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Chat] Error:', err)
    const isRateLimit = /rate limit|quota|429/i.test(msg)
    const isAuth = /api key|unauthorized|401|403/i.test(msg)
    const status = isRateLimit ? 429 : isAuth ? 401 : 500
    let userMsg = msg
    if (isRateLimit) userMsg = 'AI service is busy. Please try again in a moment.'
    else if (isAuth) userMsg = 'AI API key is invalid or expired. Check your environment variables.'
    return Response.json(
      { error: userMsg },
      { status, headers: corsHeaders(origin) }
    )
  }
}

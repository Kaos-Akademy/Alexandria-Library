import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { xai } from '@ai-sdk/xai'
import { LIBRARIAN_SYSTEM_PROMPT } from '@/lib/librarianKnowledge'

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

export async function POST(request: Request) {
  const origin = request.headers.get('origin') || request.headers.get('referer')

  let model
  try {
    model = getModel()
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('[Chat]', msg)
    return Response.json(
      { error: 'Server configuration error' },
      { status: 500, headers: corsHeaders(origin) }
    )
  }

  let body: { messages?: UIMessage[] }
  try {
    body = await request.json()
  } catch {
    return Response.json(
      { error: 'Invalid JSON body' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const { messages } = body ?? {}
  if (!Array.isArray(messages)) {
    return Response.json(
      { error: 'messages array is required' },
      { status: 400, headers: corsHeaders(origin) }
    )
  }

  const result = streamText({
    model,
    system: LIBRARIAN_SYSTEM_PROMPT,
    messages: await convertToModelMessages(messages),
  })

  return result.toUIMessageStreamResponse({
    headers: {
      'Content-Encoding': 'none',
      ...corsHeaders(origin),
    },
    onError: (error) => {
      console.error('[Chat] Error:', error)
      return error instanceof Error ? error.message : String(error)
    },
  })
}

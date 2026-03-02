import type { VercelRequest, VercelResponse } from '@vercel/node'
import { streamText, convertToModelMessages, type UIMessage } from 'ai'
import { google } from '@ai-sdk/google'
import { LIBRARIAN_SYSTEM_PROMPT } from '../lib/librarianKnowledge'

export const config = {
  maxDuration: 30,
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || req.headers.referer
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin)
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Access-Control-Max-Age', '86400')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
  if (!apiKey) {
    console.error('[Chat] GOOGLE_GENERATIVE_AI_API_KEY is not set')
    return res.status(500).json({ error: 'Server configuration error' })
  }

  const { messages } = (req.body || {}) as { messages?: UIMessage[] }
  if (!Array.isArray(messages)) {
    return res.status(400).json({ error: 'messages array is required' })
  }

  try {
    const result = streamText({
      model: google('gemini-2.0-flash'),
      system: LIBRARIAN_SYSTEM_PROMPT,
      messages: await convertToModelMessages(messages),
    })

    const response = result.toUIMessageStreamResponse({
      headers: { 'Content-Encoding': 'none' },
      onError: (error) => {
        console.error('[Chat] Error:', error)
        return error instanceof Error ? error.message : String(error)
      },
    })

    res.status(response.status)
    response.headers.forEach((v, k) => {
      const key = k.toLowerCase()
      if (key !== 'content-encoding') {
        res.setHeader(k, v)
      }
    })

    if (response.body) {
      const reader = response.body.getReader()
      const pump = async (): Promise<void> => {
        try {
          const { done, value } = await reader.read()
          if (done) {
            res.end()
            return
          }
          res.write(Buffer.from(value))
          await pump()
        } catch (err) {
          console.error('[Chat] Stream error:', err)
          if (!res.headersSent) {
            res.status(500).json({
              error: err instanceof Error ? err.message : 'Stream failed',
            })
          }
        }
      }
      await pump()
    } else {
      res.end()
    }
  } catch (err) {
    console.error('[Chat] Error:', err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Failed to process chat',
    })
  }
}

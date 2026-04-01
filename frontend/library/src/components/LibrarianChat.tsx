'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { chatMarkdownComponents, joinChatMessageParts } from '@/lib/chatMarkdown'

function getErrorMessage(error: unknown): { display: React.ReactNode; raw: string } {
  const raw = error instanceof Error ? error.message : String(error)
  let display: string
  try {
    const parsed = JSON.parse(raw) as { error?: string; message?: string; received?: string }
    display = parsed.error || parsed.message || raw
    if (parsed.received) display += ` (received: ${parsed.received})`
  } catch {
    display = raw
  }
  if (/^Bad Request$/i.test(display) || /^Failed to fetch/i.test(display)) {
    return {
      display: (
        <>
          {display}. The chat server may have rejected the request — check the Network tab (F12 → Network)
          for the /api/chat response to see the actual error.
        </>
      ),
      raw,
    }
  }
  return { display, raw }
}

const apiUrl = '/api/chat'

const LOADING_MESSAGES = [
  'Consulting the archives…',
  'Searching the shelves…',
  'Reading the index…',
  'Fetching from the collection…',
  'Preparing a response…',
]

function getRandomLoadingMessage() {
  return LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]
}

export default function LibrarianChat() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
      credentials: 'omit',
    }),
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null)
  const [welcomeLoading, setWelcomeLoading] = useState(true)
  const [welcomeLoadingMessage] = useState(() => getRandomLoadingMessage())
  const [loadingMessage, setLoadingMessage] = useState(() => getRandomLoadingMessage())
  const wasLoadingRef = useRef(false)

  useEffect(() => {
    const isLoading = status === 'submitted' || status === 'streaming'
    if (isLoading && !wasLoadingRef.current) {
      setLoadingMessage(getRandomLoadingMessage())
    }
    wasLoadingRef.current = isLoading
  }, [status])

  useEffect(() => {
    fetch('/api/welcome')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        setWelcomeMessage(data?.welcome ?? null)
      })
      .catch(() => setWelcomeMessage(null))
      .finally(() => setWelcomeLoading(false))
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = input.trim()
    if (trimmed && status === 'ready') {
      sendMessage({ text: trimmed })
      setInput('')
    }
  }

  const renderInitialMessage = () => {
    if (welcomeLoading) {
      return (
        <div className="text-center py-8 text-sm text-gray-500">
          <p className="font-medium text-gray-700 mb-1">Ask the Librarian</p>
          <p className="animate-pulse">{welcomeLoadingMessage}</p>
        </div>
      )
    }
    const welcome = welcomeMessage?.trim()
    return (
      <div className="text-center py-8 text-sm text-gray-500">
        <p className="font-medium text-gray-700 mb-1">Ask the Librarian</p>
        <p className="text-gray-700 leading-relaxed">
          {welcome || 'Welcome to the Alexandria Library. How can I help you today?'}
        </p>
        <p className="mt-3 text-gray-500">
          Try: &quot;What is the Alexandria Library?&quot; or &quot;How can I contribute?&quot;
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && renderInitialMessage()}
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                message.role === 'user'
                  ? 'bg-emerald-100 text-emerald-900'
                  : 'bg-gray-100 text-gray-800'
              }`}
            >
              <div className="break-words text-left [&_*:first-child]:mt-0">
                <ReactMarkdown components={chatMarkdownComponents}>
                  {joinChatMessageParts(message.parts)}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
              <span className="animate-pulse">{loadingMessage}</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (() => {
        const { display, raw } = getErrorMessage(error)
        return (
        <div className="px-4 py-3 text-sm text-red-700 bg-red-50 border-t border-red-100">
          <p className="font-medium">Something went wrong</p>
          <p className="mt-1 text-red-600">{display}</p>
          <details className="mt-2">
            <summary className="cursor-pointer text-xs text-red-500 hover:text-red-600">
              Technical details
            </summary>
            <pre className="mt-1 overflow-x-auto rounded bg-red-100/50 p-2 font-mono text-[10px] text-red-800">
              {raw}
            </pre>
          </details>
          <p className="mt-2 text-xs text-red-500">
            <a href={typeof window !== 'undefined' ? window.location.href : '#'} className="underline hover:no-underline">
              Refresh the page
            </a>
            {' to try again.'}
          </p>
        </div>
        )
      })()}
      <form onSubmit={handleSubmit} className="p-4 border-t border-gray-100">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== 'ready'}
            placeholder="Ask the Librarian..."
            className="flex-1 min-h-[44px] rounded-lg border border-gray-200 px-4 py-2.5 text-sm
              focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
              disabled:bg-gray-50 disabled:text-gray-400"
            aria-label="Chat message"
          />
          <button
            type="submit"
            disabled={status !== 'ready' || !input.trim()}
            className="min-h-[44px] px-4 py-2.5 rounded-lg text-sm font-medium
              bg-emerald-600 text-white hover:bg-emerald-700
              disabled:bg-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed
              focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  )
}

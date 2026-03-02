'use client'
import { useChat } from '@ai-sdk/react'
import { DefaultChatTransport } from 'ai'
import { useState, useRef, useEffect } from 'react'

const apiUrl = '/api/chat'

export default function LibrarianChat() {
  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: apiUrl,
      credentials: 'omit',
    }),
  })
  const [input, setInput] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

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

  return (
    <div className="flex flex-col flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-sm">
      <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-[200px]">
        {messages.length === 0 && (
          <div className="text-center py-8 text-sm text-gray-500">
            <p className="font-medium text-gray-700 mb-1">Ask the Librarian</p>
            <p>I know everything about the Alexandria Library — historical and this project.</p>
            <p className="mt-2">Try: &quot;What is the Alexandria Library?&quot; or &quot;How can I contribute?&quot;</p>
          </div>
        )}
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
              <div className="whitespace-pre-wrap break-words">
                {message.parts?.map((part, i) =>
                  part.type === 'text' ? (
                    <span key={i}>{part.text}</span>
                  ) : null
                )}
              </div>
            </div>
          </div>
        ))}
        {(status === 'submitted' || status === 'streaming') && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-3 py-2 text-sm text-gray-500">
              <span className="animate-pulse">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {error && (
        <div className="px-4 py-2 text-xs text-red-600 bg-red-50 border-t border-red-100">
          Something went wrong. Please try again.
          <span className="block mt-1 font-mono text-[10px] opacity-80" title={String(error)}>
            {error instanceof Error ? error.message : String(error)}
          </span>
        </div>
      )}
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

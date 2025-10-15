import './App.css'
import { getGenresWithBooks } from './flow/actions'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await getGenresWithBooks()
        if (!cancelled) setData(res)
      } catch (e) {
        // Log and continue with empty suggestions
        console.error(e)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const allBooks = useMemo(() => {
    const titles: string[] = []
    for (const { books } of data) {
      if (Array.isArray(books)) {
        for (const title of books) {
          titles.push(title)
        }
      }
    }
    // De-duplicate while preserving order
    const seen = new Set<string>()
    const unique: string[] = []
    for (const t of titles) {
      if (!seen.has(t)) {
        seen.add(t)
        unique.push(t)
      }
    }
    return unique
  }, [data])

  useEffect(() => {
    const q = query.trim().toLowerCase()
    if (q.length === 0) {
      setSuggestions([])
      setIsOpen(false)
      setHighlightedIndex(-1)
      return
    }

    // Simple relevance: prefix matches first, then substring matches; stable order
    const prefixMatches: string[] = []
    const substringMatches: string[] = []
    for (const title of allBooks) {
      const lc = title.toLowerCase()
      if (lc.startsWith(q)) {
        prefixMatches.push(title)
      } else if (lc.includes(q)) {
        substringMatches.push(title)
      }
    }

    const next = [...prefixMatches, ...substringMatches].slice(0, 8)
    setSuggestions(next)
    setIsOpen(next.length > 0)
    setHighlightedIndex(next.length > 0 ? 0 : -1)
  }, [query, allBooks])

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (!isOpen || suggestions.length === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((idx) => (idx + 1) % suggestions.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((idx) => (idx - 1 + suggestions.length) % suggestions.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        setQuery(suggestions[highlightedIndex])
        setIsOpen(false)
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Alexandria Library</h1>
      {/* Autocomplete search bar */}
      <div className="relative mb-8">
        <label htmlFor="book-search" className="sr-only">Search books</label>
        <input
          id="book-search"
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true)
          }}
          onBlur={() => {
            // Delay to allow click events to register
            setTimeout(() => setIsOpen(false), 100)
          }}
          placeholder="Search by book title"
          disabled={loading}
          className="w-full border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-autocomplete="list"
          aria-controls="book-search-listbox"
          aria-expanded={isOpen}
          aria-activedescendant={highlightedIndex >= 0 ? `option-${highlightedIndex}` : undefined}
          aria-disabled={loading}
        />
        {isOpen && suggestions.length > 0 && (
          <ul
            id="book-search-listbox"
            role="listbox"
            className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded shadow max-h-60 overflow-auto"
          >
            {suggestions.map((s, i) => (
              <li
                id={`option-${i}`}
                key={s}
                role="option"
                aria-selected={i === highlightedIndex}
                className={
                  `px-4 py-2 cursor-pointer ` +
                  (i === highlightedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-gray-50')
                }
                onMouseDown={(e) => {
                  // prevent blur before click
                  e.preventDefault()
                  setQuery(s)
                  setIsOpen(false)
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export default App

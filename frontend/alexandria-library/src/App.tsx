import './App.css'
import { getGenresWithBooks, fetchBookChapters as getBookChapters, type BookChaptersResponse, type BookChapterEntry } from './flow/actions'
import { useEffect, useMemo, useState } from 'react'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState<number>(-1)
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Array<{ title: string; paragraphs: string[] }>>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [chaptersError, setChaptersError] = useState<string | null>(null)
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null)

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
                  setSelectedBook(s)
                  setLoadingChapters(true)
                  setChaptersError(null)
                  setSelectedChapterIdx(null)
                  ;(async () => {
                    try {
                      const res: BookChaptersResponse = await getBookChapters(s)
                      const entries: BookChapterEntry[] = Object.values(res.Chapters)
                      const normalized = entries
                        .map((c) => ({
                          title: c.chapterTitle,
                          paragraphs: c.paragraphs,
                          index: typeof c.index === 'string' ? parseInt(c.index, 10) : c.index,
                        }))
                        .filter((c) => c.title && Array.isArray(c.paragraphs))
                        .sort((a, b) => (a.index ?? 0) - (b.index ?? 0))
                        .map(({ title, paragraphs }) => ({ title, paragraphs }))
                      setChapters(normalized)
                    } catch (err) {
                      setChapters([])
                      setChaptersError(err instanceof Error ? err.message : 'Failed to load chapters')
                    } finally {
                      setLoadingChapters(false)
                    }
                  })()
                }}
                onMouseEnter={() => setHighlightedIndex(i)}
              >
                {s}
              </li>
            ))}
          </ul>
        )}
      </div>

      {selectedBook && (
        <div className="space-y-3">
          <h2 className="text-xl font-semibold">Chapters for {selectedBook}</h2>
          {loadingChapters ? (
            <div className="text-gray-600">Loading chapters...</div>
          ) : chaptersError ? (
            <div className="text-red-600">{chaptersError}</div>
          ) : chapters.length === 0 ? (
            <div className="text-gray-500">No chapters found.</div>
          ) : (
            <div className="space-y-4">
              {selectedChapterIdx === null ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {chapters.map((chapter, idx) => (
                    <button
                      key={idx + '-' + chapter.title}
                      type="button"
                      className="text-left px-4 py-2 border rounded hover:bg-gray-50"
                      onClick={() => setSelectedChapterIdx(idx)}
                    >
                      {chapter.title}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">{chapters[selectedChapterIdx].title}</h3>
                    <button
                      type="button"
                      className="text-sm text-blue-600 hover:underline"
                      onClick={() => setSelectedChapterIdx(null)}
                    >
                      Back to chapters
                    </button>
                  </div>
                  <div className="space-y-4">
                    {chapters[selectedChapterIdx].paragraphs.map((p, i) => (
                      <p key={i} className="leading-relaxed">{p}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default App

import { Link } from 'react-router-dom'
import { getGenresWithBooks, fetchChapterTitles, fetchAuthors, fetchBooksByAuthor } from '../flow/actions'
import { useEffect, useMemo, useState } from 'react'
import { useFlowQuery } from '@onflow/react-sdk'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'
import GenrePanels from '@/components/GenrePanels'

const TARGET_FLOW = 135_000

export default function Home() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [authors, setAuthors] = useState<string[]>([])
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null)
  const [authorBooks, setAuthorBooks] = useState<string[] | null>(null)
  const [chapters, setChapters] = useState<Array<{ title: string; paragraphs: string[] | null }>>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [chaptersError, setChaptersError] = useState<string | null>(null)
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const [genresWithBooks, authorsResponse] = await Promise.all([
          getGenresWithBooks(),
          fetchAuthors(),
        ])
        if (!cancelled) {
          setData(genresWithBooks)
          setAuthors(authorsResponse)
        }
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  const bookCount = useMemo(() => {
    const seen = new Set<string>()
    for (const { books } of data) {
      if (Array.isArray(books)) {
        for (const t of books) if (t) seen.add(t)
      }
    }
    return seen.size
  }, [data])

  const { data: raisedBalance } = useFlowQuery({
    cadence: `
      import FlowToken from 0x1654653399040a61
      access(all) fun main(address: Address): UFix64 {
        let account = getAccount(address)
        let vaultRef = account.capabilities
          .get<&FlowToken.Vault>(/public/flowTokenBalance)
          .borrow()
          ?? panic("Could not borrow Balance reference")
        return vaultRef.balance
      }
    `,
    args: (arg, t) => [arg('0xfed1adffd14ea9d0', t.Address)],
    query: { refetchInterval: 15000 },
  })
  const raisedFlow = raisedBalance != null ? Number(raisedBalance) : 0

  const handleSelectAuthor = async (author: string) => {
    setSelectedAuthor(author)
    setSelectedBook(null)
    setSelectedGenre(null)
    setSelectedChapterIdx(null)
    setChapters([])
    setChaptersError(null)
    setLoadingChapters(false)
    try {
      const books = await fetchBooksByAuthor(author)
      setAuthorBooks(books ?? [])
    } catch (e) {
      console.error(e)
      setAuthorBooks([])
    }
  }

  const handleSelectBook = (value: string) => {
    setSelectedAuthor(null)
    setAuthorBooks(null)
    setSelectedBook(value)
    const genreEntry = data.find((d) => Array.isArray(d.books) && d.books.includes(value))
    setSelectedGenre(genreEntry?.genre ?? null)
    setLoadingChapters(true)
    setChaptersError(null)
    setSelectedChapterIdx(null)
    ;(async () => {
      try {
        const chapterTitles: unknown = await fetchChapterTitles(value)
        if (!Array.isArray(chapterTitles)) {
          throw new Error('Invalid response: expected array of chapter titles')
        }
        const normalized = chapterTitles
          .filter((title): title is string => typeof title === 'string' && title.length > 0)
          .map((title) => ({ title, paragraphs: null as string[] | null }))
        setChapters(normalized)
      } catch (err) {
        setChapters([])
        setChaptersError(err instanceof Error ? err.message : 'Failed to load chapters')
      } finally {
        setLoadingChapters(false)
      }
    })()
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 md:py-8 flex flex-col min-h-screen">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-center sm:gap-6 md:gap-8 mb-4">
          <div className="flex justify-end sm:justify-center sm:order-2 sm:flex-shrink-0">
            <Link
              to="/mission"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:text-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 rounded px-2 py-1 -m-1 transition-colors"
              aria-label="Read our mission"
            >
              Our mission
              <span className="text-[0.65rem] opacity-80" aria-hidden>→</span>
            </Link>
          </div>
          <div className="flex flex-col items-center text-center sm:order-1 gap-4 sm:gap-5">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold alexandria-title">
              <Link
                to="/"
                onClick={() => {
                  setSelectedBook(null)
                  setSelectedChapterIdx(null)
                }}
                className="text-inherit no-underline hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 rounded"
              >
                Alexandria Library
              </Link>
            </h1>
            <p className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600">
              Knowledge belongs to everyone, forever.
            </p>
            <div className="flex flex-col gap-1.5 w-full max-w-[280px]">
              <Link
                to="/roadmap"
                className="flex flex-col gap-1.5 w-full px-2.5 py-2 rounded-lg border border-gray-200/80 bg-gray-50/50 hover:border-emerald-200 hover:bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 transition-colors"
                aria-label="View 2026 roadmap and progress"
              >
                <span className="text-xs font-semibold text-gray-700 flex justify-between items-center">
                  <span>{bookCount.toLocaleString()} / 1,000 books</span>
                  <span className="text-emerald-600 font-medium">View roadmap →</span>
                </span>
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (bookCount / 1000) * 100)}%` }}
                  />
                </div>
              </Link>
              <Link
                to="/contribute"
                className="flex flex-col gap-1.5 w-full px-2.5 py-2 rounded-lg border border-gray-200/80 bg-gray-50/50 hover:border-emerald-200 hover:bg-emerald-50/30 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-offset-2 transition-colors"
                aria-label="Contribution progress"
              >
                <span className="text-xs font-semibold text-gray-700 flex justify-between items-center">
                  <span>{Math.floor(raisedFlow).toLocaleString()} / {TARGET_FLOW.toLocaleString()} FLOW</span>
                  <span className="text-emerald-600 font-medium">Contribute →</span>
                </span>
                <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${Math.min(100, (raisedFlow / TARGET_FLOW) * 100)}%` }}
                  />
                </div>
              </Link>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <BookCommandPalette
            data={data}
            authors={authors}
            inline
            onSelectBook={handleSelectBook}
            onSelectAuthor={handleSelectAuthor}
          />

          {selectedAuthor && !selectedBook && (
            <section className="w-full">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base sm:text-lg font-semibold text-gray-800">
                  Books by {selectedAuthor}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedAuthor(null)
                    setAuthorBooks(null)
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear author
                </button>
              </div>
              {authorBooks && authorBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authorBooks.map((title) => (
                    <button
                      key={title}
                      type="button"
                      onClick={() => handleSelectBook(title)}
                      className="w-full text-left px-3 py-2 rounded-md border border-gray-200 bg-white text-sm sm:text-base hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-colors"
                    >
                      {title}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No books found for this author.
                </p>
              )}
            </section>
          )}

          {!selectedBook && (
            <GenrePanels
              data={data}
              genreFilter={genreFilter}
              onGenreFilterChange={setGenreFilter}
              onSelectBook={handleSelectBook}
            />
          )}

          {selectedBook && (
            <ChaptersView
              selectedBook={selectedBook}
              selectedGenre={selectedGenre}
              chapters={chapters}
              loading={loadingChapters}
              error={chaptersError}
              selectedChapterIdx={selectedChapterIdx}
              onSelectChapter={setSelectedChapterIdx}
              onChaptersUpdate={setChapters}
            />
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-black/5 flex flex-col items-center gap-4">
          <Link
            to="/contribute"
            className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold
                       bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 text-black
                       shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40
                       hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-300
                       transition-all duration-200"
          >
            Keep Knowledge Alive
          </Link>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 justify-center">
            <Link to="/docs" className="hover:text-gray-700 transition-colors underline">
              Docs
            </Link>
            <Link
              to="/privacy-policy"
              className="hover:text-gray-700 transition-colors underline"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms-of-service"
              className="hover:text-gray-700 transition-colors underline"
            >
              Terms of Service
            </Link>
            <a
              href="https://x.com/AlexandriaLib_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-700 transition-colors underline"
            >
              X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

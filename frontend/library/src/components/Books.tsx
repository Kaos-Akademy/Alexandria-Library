'use client'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { getGenresWithBooks, fetchChapterTitles, fetchAuthors, fetchBooksByAuthor } from '../flow/actions'
import { useEffect, useMemo, useRef, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'
import GenrePanels from '@/components/GenrePanels'
import { bannedTitleToSlug, bannedTitles } from '@/lib/bannedBooksData'

function BannedBadge({ title }: { title: string }) {
  const slug = bannedTitleToSlug.get(title)
  if (!slug) return null
  return (
    <Link
      href={`/banned-books/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className="ml-2 inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 hover:bg-amber-200 transition-colors"
    >
      Banned
    </Link>
  )
}

function MatchingAuthors({
  authors,
  searchQuery,
  onSelectAuthor,
}: { authors: string[]; searchQuery: string; onSelectAuthor: (a: string) => void }) {
  const q = searchQuery.trim().toLowerCase()
  const matching = useMemo(
    () => (q ? authors.filter((a) => (a || '').toLowerCase().includes(q)) : []),
    [authors, q]
  )
  if (matching.length === 0) return null
  return (
    <section className="w-full mb-3">
      <h2 className="text-sm font-semibold text-gray-500 mb-2">Matching authors</h2>
      <div className="flex flex-wrap gap-2">
        {matching.map((author) => (
          <button
            key={author}
            type="button"
            onClick={() => onSelectAuthor(author)}
            className="px-3 py-1.5 rounded-md border border-gray-200 bg-white text-sm text-gray-800 hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-800 transition-colors"
          >
            {author}
          </button>
        ))}
      </div>
    </section>
  )
}

export default function Books() {
  const searchParams = useSearchParams()
  const bookParam = searchParams.get('book')
  const autoSelectedRef = useRef(false)

  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [searchQuery, setSearchQuery] = useState<string>('')
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

  useEffect(() => {
    if (!bookParam || data.length === 0 || autoSelectedRef.current) return
    const decoded = decodeURIComponent(bookParam)
    const exists = data.some(
      (entry) => Array.isArray(entry.books) && entry.books.includes(decoded)
    )
    if (exists) {
      autoSelectedRef.current = true
      handleSelectBook(decoded)
    }
  }, [bookParam, data])

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-sm text-gray-600">
            Browse the full on-chain collection by genre, author, or title.
          </p>
          <Link
            href="/banned-books"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-amber-800 hover:text-amber-900 underline shrink-0"
          >
            Banned books collection
            <span aria-hidden>→</span>
          </Link>
        </div>

        <div className="flex flex-col gap-4">
          <BookCommandPalette
            inline
            data={data}
            authors={authors}
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
                  className="inline-flex min-h-[44px] items-center px-2 text-xs text-gray-500 hover:text-gray-700 underline"
                >
                  Clear author
                </button>
              </div>
              {authorBooks && authorBooks.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {authorBooks.map((title) => (
                    <div
                      key={title}
                      className="flex min-h-[44px] w-full items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm sm:text-base hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <button
                        type="button"
                        onClick={() => handleSelectBook(title)}
                        className="min-h-[44px] flex-1 text-left text-gray-800 hover:text-emerald-800"
                      >
                        {title}
                      </button>
                      {bannedTitles.has(title) && <BannedBadge title={title} />}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No books found for this author.
                </p>
              )}
            </section>
          )}

          {searchQuery.trim() && (
            <MatchingAuthors
              authors={authors}
              searchQuery={searchQuery}
              onSelectAuthor={handleSelectAuthor}
            />
          )}

          {!selectedBook && (
            <GenrePanels
              data={data}
              genreFilter={genreFilter}
              onGenreFilterChange={setGenreFilter}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
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

        <div className="mt-8 pt-6 border-t border-gray-200">
          {selectedBook ? (
            <button
              type="button"
              onClick={() => {
                setSelectedBook(null)
                setSelectedChapterIdx(null)
              }}
              className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium"
            >
              ← Back to Book Search
            </button>
          ) : (
            <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium">
              ← Back to Home
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

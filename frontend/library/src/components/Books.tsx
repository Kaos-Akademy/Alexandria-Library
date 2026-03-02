'use client'
import Link from 'next/link'
import { getGenresWithBooks, fetchChapterTitles, fetchAuthors, fetchBooksByAuthor } from '../flow/actions'
import { useEffect, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'
import GenrePanels from '@/components/GenrePanels'

export default function Books() {
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
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <Link href="/" className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold alexandria-title block mb-2 sm:mb-4">
            Alexandria Library
          </Link>
          <p className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600">
            Knowledge belongs to everyone, forever.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <BookCommandPalette
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

        <div className="mt-8 pt-6 border-t border-gray-200">
          <Link href="/" className="text-sm text-emerald-600 hover:text-emerald-700 underline font-medium">
            ← Back to Library
          </Link>
        </div>
      </div>
    </div>
  )
}

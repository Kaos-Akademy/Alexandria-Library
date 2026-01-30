import { Link } from 'react-router-dom'
import { getGenresWithBooks, fetchChapterTitles } from '../flow/actions'
import { useEffect, useMemo, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'
import GenrePanels from '@/components/GenrePanels'

export default function Home() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [genreFilter, setGenreFilter] = useState<string>('')
  const [chapters, setChapters] = useState<Array<{ title: string; paragraphs: string[] | null }>>([])
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

  const handleSelectBook = (value: string) => {
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
        <div className="text-center mb-4 space-y-2">
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
          <div className="flex flex-col items-center gap-3">
            <Link to="/mission" className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600 border-b border-purple-600 pb-0.5 hover:opacity-80 transition-opacity inline-block">
              Knowledge belongs to everyone, forever.
            </Link>
            <Link
              to="/roadmap"
              className="flex flex-col gap-1 w-full max-w-[240px]"
              aria-label="Progress toward 1,000 books — view roadmap"
            >
              <span className="text-xs text-gray-500 font-medium">
                {bookCount.toLocaleString()} / 1,000 books
              </span>
              <div className="h-1.5 w-full rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-purple-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, (bookCount / 1000) * 100)}%` }}
                />
              </div>
            </Link>
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4">
          <BookCommandPalette data={data} inline onSelectBook={handleSelectBook} />

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

        <div className="mt-6 pt-4 border-t border-black/5 flex justify-center">
          <Link
            to="/donate"
            className="inline-flex items-center justify-center rounded-full px-4 py-1.5 text-xs font-semibold
                       bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 text-black
                       shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40
                       hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-300
                       transition-all duration-200"
          >
            Donate to the Library
          </Link>
        </div>
      </div>
    </div>
  )
}

import { Link } from 'react-router-dom'
import { getGenresWithBooks, fetchChapterTitles } from '../flow/actions'
import { useEffect, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'

export default function Home() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
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

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="text-center mb-4">
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold alexandria-title">Alexandria Library</h1>
          <Link to="/mission" className="block text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600 border-b border-purple-600 pb-0.5 hover:opacity-80 transition-opacity inline-block">
            Knowledge belongs to everyone, forever.
          </Link>
        </div>

        <BookCommandPalette
          data={data}
          inline
          onSelectBook={(value) => {
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
          }}
        />

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
    </div>
  )
}

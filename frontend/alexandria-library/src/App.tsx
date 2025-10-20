import './App.css'
import '@/components/ui/title-animation.css'
import { getGenresWithBooks, fetchBookChapters as getBookChapters, type BookChaptersResponse, type BookChapterEntry } from './flow/actions'
import { useEffect, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  // Inline search; no dialog state
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Array<{ title: string; paragraphs: string[] }>>([])
  const [loadingChapters, setLoadingChapters] = useState(false)
  const [chaptersError, setChaptersError] = useState<string | null>(null)
  const [selectedChapterIdx, setSelectedChapterIdx] = useState<number | null>(null)
  // Query and active genre are managed within BookCommandPalette

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await getGenresWithBooks()
        if (!cancelled) setData(res)
      } catch (e) {
        // Log and continue with empty suggestions
        console.error(e)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  // Keep App.tsx focused on data fetching and rendering children

  // Filtering now lives in BookCommandPalette

  // Derived per-genre filtering is used for rendering; no flat list needed.

  // Per-genre filtering is achieved via activeGenre + filteredBooks; no grouped map needed.

  // Removed keyboard shortcut for dialog

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-4">
          <h1 className="text-8xl font-bold alexandria-title">Alexandria Library</h1>
          <p className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600">Knowledge belongs to everyone, forever.</p>
        </div>

      <BookCommandPalette
        data={data}
        inline
        onSelectBook={(value) => {
          setSelectedBook(value)
          setLoadingChapters(true)
          setChaptersError(null)
          setSelectedChapterIdx(null)
          ;(async () => {
            try {
              const res: BookChaptersResponse = await getBookChapters(value)
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
      />

      {selectedBook && (
        <ChaptersView
          selectedBook={selectedBook}
          chapters={chapters}
          loading={loadingChapters}
          error={chaptersError}
          selectedChapterIdx={selectedChapterIdx}
          onSelectChapter={setSelectedChapterIdx}
        />
      )}
      </div>
    </div>
  )
}

export default App

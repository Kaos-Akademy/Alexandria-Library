import './App.css'
import { getGenresWithBooks, fetchBookChapters as getBookChapters, type BookChaptersResponse, type BookChapterEntry } from './flow/actions'
import { useEffect, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [commandOpen, setCommandOpen] = useState(false)
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

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'j' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setCommandOpen((open) => !open)
      }
    }
    document.addEventListener('keydown', down)
    return () => document.removeEventListener('keydown', down)
  }, [])

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Alexandria Library</h1>

      <div className="mb-4">
        <p className="text-sm text-gray-500">
          Press <kbd className="bg-gray-100 inline-flex h-5 items-center gap-1 rounded border px-1.5 font-mono text-[10px] font-medium"><span className="text-xs">⌘</span>J</kbd> to search books
        </p>
      </div>

      <BookCommandPalette
        data={data}
        open={commandOpen}
        onOpenChange={setCommandOpen}
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
  )
}

export default App

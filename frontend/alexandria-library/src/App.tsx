import './App.css'
import '@/components/ui/title-animation.css'
import { getGenresWithBooks, fetchChapterTitles } from './flow/actions'
import { useEffect, useState } from 'react'
import BookCommandPalette from '@/components/BookCommandPalette'
import ChaptersView from '@/components/ChaptersView'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  // Inline search; no dialog state
  const [selectedBook, setSelectedBook] = useState<string | null>(null)
  const [chapters, setChapters] = useState<Array<{ title: string; paragraphs: string[] | null }>>([])
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

  // Removed keyboard shortcut for dialog ss

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
              // Fetch only chapter titles (lightweight, no content)
              const chapterTitles: unknown = await fetchChapterTitles(value)
              if (!Array.isArray(chapterTitles)) {
                throw new Error('Invalid response: expected array of chapter titles')
              }
              // Initialize chapters with titles only, paragraphs will be loaded on-demand
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

export default App

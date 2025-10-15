import { useState } from 'react'
import Reader from '@/components/reader/Reader'

type Chapter = { title: string; paragraphs: string[] }

type Props = {
  selectedBook: string
  chapters: Chapter[]
  loading: boolean
  error: string | null
  selectedChapterIdx: number | null
  onSelectChapter: (idx: number | null) => void
}

export default function ChaptersView({ selectedBook, chapters, loading, error, selectedChapterIdx, onSelectChapter }: Props) {
  const [size, setSize] = useState<'sm' | 'md' | 'lg'>('md')
  // Size handled by Reader controls; retained for potential future inline rendering
  return (
    <div className="space-y-3">
      <h2 className="text-lg sm:text-xl font-semibold">Chapters for {selectedBook}</h2>
      <div className="flex items-center gap-2">
        <span className="text-xs text-gray-500">Reading size</span>
        <div className="inline-flex rounded-md border overflow-hidden">
          <button
            type="button"
            className={
              `px-2 py-1 text-xs sm:text-sm ${size === 'sm' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`
            }
            onClick={() => setSize('sm')}
            aria-pressed={size === 'sm'}
          >
            A-
          </button>
          <button
            type="button"
            className={
              `px-2 py-1 text-xs sm:text-sm border-l ${size === 'md' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`
            }
            onClick={() => setSize('md')}
            aria-pressed={size === 'md'}
          >
            A
          </button>
          <button
            type="button"
            className={
              `px-2 py-1 text-xs sm:text-sm border-l ${size === 'lg' ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`
            }
            onClick={() => setSize('lg')}
            aria-pressed={size === 'lg'}
          >
            A+
          </button>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-600">Loading chapters...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : chapters.length === 0 ? (
        <div className="text-gray-500">No chapters found.</div>
      ) : (
        <div className="space-y-4">
          {selectedChapterIdx === null ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx + '-' + chapter.title}
                  type="button"
                  className="text-left px-3 py-2 border rounded-md hover:bg-gray-50 text-sm sm:text-base"
                  onClick={() => onSelectChapter(idx)}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base sm:text-lg font-semibold">{chapters[selectedChapterIdx].title}</h3>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => onSelectChapter(null)}
                >
                  Back to chapters
                </button>
              </div>
              <div className="space-y-4">
                {
                  (() => {
                    const chapter = chapters[selectedChapterIdx]
                    const html = [
                      `<h1>${chapter.title}</h1>`,
                      ...chapter.paragraphs.map((p) => `<p>${p}</p>`),
                    ].join('')
                    return (
                      <Reader content={html} />
                    )
                  })()
                }
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



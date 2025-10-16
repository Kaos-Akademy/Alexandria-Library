// useState removed as it's no longer needed
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
  console.log('ChaptersView render:', { selectedBook, chapters: chapters.length, loading, error, selectedChapterIdx })
  return (
    <div className="w-full">
      <h2 className="text-lg sm:text-xl font-semibold mb-4 text-center">Chapters for {selectedBook}</h2>
      {loading ? (
        <div className="text-gray-600">Loading chapters...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : chapters.length === 0 ? (
        <div className="text-gray-500">No chapters found.</div>
      ) : (
        <div className="space-y-4">
          {selectedChapterIdx === null ? (
            <div className="flex flex-wrap justify-center gap-3 max-w-4xl mx-auto">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx + '-' + chapter.title}
                  type="button"
                  className="inline-block px-3 py-2 border rounded-lg hover:bg-gray-50 text-sm font-medium shadow-sm transition-colors whitespace-nowrap"
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
              <div className="w-full">
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



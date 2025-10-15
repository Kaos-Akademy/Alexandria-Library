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
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-semibold">Chapters for {selectedBook}</h2>
      {loading ? (
        <div className="text-gray-600">Loading chapters...</div>
      ) : error ? (
        <div className="text-red-600">{error}</div>
      ) : chapters.length === 0 ? (
        <div className="text-gray-500">No chapters found.</div>
      ) : (
        <div className="space-y-4">
          {selectedChapterIdx === null ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {chapters.map((chapter, idx) => (
                <button
                  key={idx + '-' + chapter.title}
                  type="button"
                  className="text-left px-4 py-2 border rounded hover:bg-gray-50"
                  onClick={() => onSelectChapter(idx)}
                >
                  {chapter.title}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">{chapters[selectedChapterIdx].title}</h3>
                <button
                  type="button"
                  className="text-sm text-blue-600 hover:underline"
                  onClick={() => onSelectChapter(null)}
                >
                  Back to chapters
                </button>
              </div>
              <div className="space-y-4">
                {chapters[selectedChapterIdx].paragraphs.map((p, i) => (
                  <p key={i} className="leading-relaxed">{p}</p>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}



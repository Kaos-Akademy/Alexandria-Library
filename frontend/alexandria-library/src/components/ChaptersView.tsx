// useState removed as it's no longer needed
import Reader from '@/components/reader/Reader'

type Chapter = { title: string; paragraphs: string[] }

// Helper function to check if a string is a base64 encoded image
function isBase64Image(str: string): boolean {
  // Base64 images are typically very long and contain only base64 characters
  // Check if string is long enough and matches base64 pattern
  if (!str || str.length < 100) return false
  const base64Pattern = /^[A-Za-z0-9+/=]+$/
  // Images when base64 encoded are typically > 1KB (base64 is ~33% larger than binary)
  return base64Pattern.test(str) && str.length > 1000
}

// Helper function to detect image format from base64 string
function detectImageFormat(base64: string): 'jpeg' | 'png' | 'unknown' {
  // Check for common base64 image signatures
  // JPEG starts with /9j/4AAQSkZJRg
  // PNG starts with iVBORw0KGgo
  if (base64.startsWith('/9j/') || base64.startsWith('iVBORw0KGgo')) {
    return base64.startsWith('/9j/') ? 'jpeg' : 'png'
  }
  // Fallback: try to decode and check magic bytes
  try {
    const binary = atob(base64.substring(0, 100))
    if (binary.startsWith('\xFF\xD8')) return 'jpeg'
    if (binary.startsWith('\x89PNG')) return 'png'
  } catch {
    // If decoding fails, default to jpeg
  }
  return 'jpeg' // Default to jpeg
}

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
                    // Check if paragraphs are base64 images
                    const isImageChapter = chapter.paragraphs.length > 0 && isBase64Image(chapter.paragraphs[0])
                    
                    if (isImageChapter) {
                      // Render as images
                      return (
                        <div className="space-y-4">
                          <h3 className="text-xl font-bold mb-4 text-center">{chapter.title}</h3>
                          <div className="flex flex-col items-center gap-4">
                            {chapter.paragraphs.map((base64Image, idx) => {
                              const format = detectImageFormat(base64Image)
                              const mimeType = format === 'png' ? 'image/png' : 'image/jpeg'
                              return (
                                <img
                                  key={idx}
                                  src={`data:${mimeType};base64,${base64Image}`}
                                  alt={`${chapter.title} - Page ${idx + 1}`}
                                  className="max-w-full h-auto rounded-lg shadow-lg"
                                  loading="lazy"
                                  style={{ maxWidth: '100%', width: 'auto' }}
                                />
                              )
                            })}
                          </div>
                        </div>
                      )
                    } else {
                      // Render as text using Reader
                      const html = [
                        `<h1>${chapter.title}</h1>`,
                        ...chapter.paragraphs.map((p) => `<p>${p}</p>`),
                      ].join('')
                      return (
                        <Reader content={html} />
                      )
                    }
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



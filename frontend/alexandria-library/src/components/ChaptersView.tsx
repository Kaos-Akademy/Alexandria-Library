import { useState, useEffect, useRef } from 'react'
import Reader from '@/components/reader/Reader'
import { fetchChapterParagraph } from '@/flow/actions'

type Chapter = { title: string; paragraphs: string[] | null }

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
  onChaptersUpdate: (chapters: Chapter[]) => void
}

export default function ChaptersView({ selectedBook, chapters, loading, error, selectedChapterIdx, onSelectChapter, onChaptersUpdate }: Props) {
  const [loadingChapterContent, setLoadingChapterContent] = useState(false)
  const [chapterContentError, setChapterContentError] = useState<string | null>(null)
  const [loadingProgress, setLoadingProgress] = useState<string>('')
  const cancelledRef = useRef(false)
  const chaptersRef = useRef(chapters)
  
  // Keep chaptersRef in sync with chapters prop
  chaptersRef.current = chapters

  // Fetch chapter content on-demand when a chapter is selected
  useEffect(() => {
    if (selectedChapterIdx === null) return
    
    const chapter = chapters[selectedChapterIdx]
    if (!chapter) return
    
    // If paragraphs are already loaded (not null and has content), skip fetching
    if (chapter.paragraphs !== null && chapter.paragraphs.length > 0) return

    // Reset cancellation flag
    cancelledRef.current = false
    
    // Fetch chapter content on-demand
    setLoadingChapterContent(true)
    setChapterContentError(null)
    setLoadingProgress('Starting...')

    const fetchChapterContent = async () => {
      try {
        const paragraphs: string[] = []
        const BATCH_SIZE = 1 // Load 1 image at a time for fastest initial display
        let currentIndex = 0
        let consecutiveEmptyBatches = 0
        let hasShownContent = false

        const updateUI = (newParagraphs: string[]) => {
          if (cancelledRef.current) return
          const updatedChapters = [...chaptersRef.current]
          if (updatedChapters[selectedChapterIdx]) {
            updatedChapters[selectedChapterIdx] = {
              ...updatedChapters[selectedChapterIdx],
              paragraphs: [...newParagraphs]
            }
            onChaptersUpdate(updatedChapters)
          }
        }

        // Continuous loading: fetch 1 image at a time, show immediately, repeat
        // This gives the fastest initial display - first image appears ASAP
        while (!cancelledRef.current && consecutiveEmptyBatches < 3) {
          // Fetch single image
          let imageResult: { index: number; value: string | null }
          
          try {
            const value = await fetchChapterParagraph(selectedBook, chapter.title, currentIndex)
            imageResult = { index: currentIndex, value }
          } catch {
            imageResult = { index: currentIndex, value: null }
          }
          
          // Check if cancelled during fetch
          if (cancelledRef.current) break
          
          // Process the result
          const batchResults = [imageResult]
          
          // Check if cancelled during fetch
          if (cancelledRef.current) break
          
          // Extract successful result
          const { value } = batchResults[0]
          const hasImage = value && typeof value === 'string' && value.length > 0
          const newImages = hasImage ? [value] : []
          
          if (newImages.length > 0) {
            // We got images! Add them and update UI immediately
            consecutiveEmptyBatches = 0
            paragraphs.push(...newImages)
            
            // Show content immediately on first batch
            if (!hasShownContent && !cancelledRef.current) {
              updateUI(paragraphs)
              setLoadingChapterContent(false) // Hide loading state - user sees content!
              setLoadingProgress('')
              hasShownContent = true
            } else if (!cancelledRef.current) {
              // Update UI progressively as more images load
              updateUI(paragraphs)
            }
            
            // Move to next batch - continue the loop
            currentIndex += BATCH_SIZE
            // Explicitly continue - don't let the loop exit
            // The while condition will check again
          } else {
            // No images in this batch - increment empty counter
            consecutiveEmptyBatches++
            
            // If we haven't shown any content yet, try next index
            if (!hasShownContent) {
              currentIndex += BATCH_SIZE
              // After trying a few empty batches, give up
              if (consecutiveEmptyBatches >= 3) {
                // No content found at all
                if (!cancelledRef.current) {
                  updateUI([])
                  setLoadingChapterContent(false)
                  setLoadingProgress('')
                }
                break
              }
              // Continue trying
              continue
            } else {
              // We've shown content before, so empty batch means we're done
              break
            }
          }
        }

        // Final update to ensure all paragraphs are included
        if (!cancelledRef.current && paragraphs.length > 0) {
          updateUI(paragraphs)
        } else if (!cancelledRef.current && !hasShownContent) {
          // No content was ever found
          updateUI([])
          setLoadingChapterContent(false)
          setLoadingProgress('')
        }
      } catch (err) {
        if (cancelledRef.current) return
        
        const errorMessage = err instanceof Error ? err.message : 'Failed to load chapter content'
        setChapterContentError(errorMessage)
        console.error('Error loading chapter content:', err)
        
        // Update chapter with empty array to prevent retry loops
        if (!cancelledRef.current) {
          const updatedChapters = [...chapters]
          updatedChapters[selectedChapterIdx] = {
            ...chapter,
            paragraphs: []
          }
          onChaptersUpdate(updatedChapters)
        }
      } finally {
        if (!cancelledRef.current) {
          setLoadingChapterContent(false)
        }
      }
    }

    fetchChapterContent()
    
    return () => {
      cancelledRef.current = true
    }
    // Only depend on selectedChapterIdx and selectedBook - not chapters to avoid re-triggering
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedChapterIdx, selectedBook])

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
                {loadingChapterContent ? (
                  <div className="text-gray-600 text-center py-8">
                    <div>Loading chapter content...</div>
                    {loadingProgress && (
                      <div className="text-sm text-gray-500 mt-2">{loadingProgress}</div>
                    )}
                  </div>
                ) : chapterContentError ? (
                  <div className="text-red-600 text-center py-8">{chapterContentError}</div>
                ) : (() => {
                    const chapter = chapters[selectedChapterIdx]
                    
                    // If paragraphs haven't been loaded yet, show loading state
                    if (chapter.paragraphs === null) {
                      return <div className="text-gray-600 text-center py-8">Preparing to load chapter...</div>
                    }
                    
                    // If no paragraphs, show empty state
                    if (chapter.paragraphs.length === 0) {
                      return <div className="text-gray-500 text-center py-8">No content found for this chapter.</div>
                    }
                    
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



'use client'

import { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { fetchBookChapterByTitle } from '@/flow/actions'
import Reader from '@/components/reader/Reader'

function ReadContent() {
  const searchParams = useSearchParams()
  const book = searchParams.get('book')
  const chapter = searchParams.get('chapter')
  const [content, setContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!book || !chapter) {
      setLoading(false)
      setError('Missing book or chapter.')
      return
    }

    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const paragraphs = await fetchBookChapterByTitle(book, chapter)
        if (cancelled) return
        if (!paragraphs.length) {
          setError('No content found for this chapter.')
          setContent(null)
          return
        }
        const html = [
          `<h1>${chapter}</h1>`,
          ...paragraphs.map((p) => `<p>${p}</p>`),
        ].join('')
        setContent(html)
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Failed to load chapter')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [book, chapter])

  if (!book || !chapter) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600">Select a book and chapter from the library.</p>
        <Link href="/library" className="text-emerald-600 underline">
          Go to Library
        </Link>
      </div>
    )
  }

  const backHref = `/library?book=${encodeURIComponent(book)}`

  return (
    <div className="flex min-h-dvh flex-col bg-[var(--reader-bg,oklch(1_0_0))]">
      <header
        className="flex shrink-0 items-center gap-3 border-b border-black/10 px-4 py-3"
        style={{ paddingTop: 'calc(0.75rem + var(--safe-top))' }}
      >
        <Link
          href={backHref}
          className="touch-target inline-flex items-center text-sm font-medium text-emerald-700"
        >
          ← Back
        </Link>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs text-gray-500">{book}</p>
          <p className="truncate text-sm font-semibold text-gray-900">{chapter}</p>
        </div>
      </header>

      <main className="min-h-0 flex-1">
        {loading && (
          <p className="py-12 text-center text-gray-500">Loading chapter…</p>
        )}
        {error && (
          <p className="py-12 text-center text-red-600">{error}</p>
        )}
        {content && !loading && !error && (
          <Reader content={content} variant="fullscreen" ariaLabel={chapter} />
        )}
      </main>
    </div>
  )
}

export default function FullscreenReaderShell() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-gray-500">
          Loading reader…
        </div>
      }
    >
      <ReadContent />
    </Suspense>
  )
}

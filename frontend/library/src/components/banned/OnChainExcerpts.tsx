'use client'

import { useEffect, useState } from 'react'
import { fetchChapterParagraph } from '@/flow/actions'
import type { BannedBookProfile } from '@/lib/bannedBooksData'

interface OnChainExcerptsProps {
  book: BannedBookProfile
}

type ExcerptState = {
  label: string
  chapterTitle: string
  text: string | null
  loading: boolean
  error: string | null
}

export default function OnChainExcerpts({ book }: OnChainExcerptsProps) {
  const [excerpts, setExcerpts] = useState<ExcerptState[]>(() =>
    book.featuredParagraphs.map((p) => ({
      label: p.label,
      chapterTitle: p.chapterTitle,
      text: null,
      loading: true,
      error: null,
    }))
  )

  useEffect(() => {
    let cancelled = false

    book.featuredParagraphs.forEach(async (para, index) => {
      try {
        const text = await fetchChapterParagraph(
          book.onChainTitle,
          para.chapterTitle,
          para.paragraphIndex
        )
        if (cancelled) return
        setExcerpts((prev) => {
          const next = [...prev]
          next[index] = {
            ...next[index],
            text: typeof text === 'string' ? text : null,
            loading: false,
            error: typeof text === 'string' ? null : 'Paragraph not found on-chain.',
          }
          return next
        })
      } catch {
        if (cancelled) return
        setExcerpts((prev) => {
          const next = [...prev]
          next[index] = {
            ...next[index],
            loading: false,
            error: 'Could not load this excerpt from the blockchain.',
          }
          return next
        })
      }
    })

    return () => {
      cancelled = true
    }
  }, [book])

  return (
    <section className="bg-zinc-950 py-16 text-zinc-200 md:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
          On-Chain Excerpts
        </span>
        <h2 className="mb-10 font-serif text-3xl font-semibold text-white md:text-4xl">
          Read the Words They Tried to Erase
        </h2>

        <div className="space-y-8">
          {excerpts.map((excerpt, i) => (
            <article
              key={`${excerpt.chapterTitle}-${i}`}
              className="rounded border border-zinc-800 bg-zinc-900/60 p-6 md:p-8"
            >
              <p className="mb-3 font-mono text-xs uppercase tracking-wider text-emerald-400">
                {excerpt.chapterTitle}
              </p>
              <p className="mb-4 text-sm text-zinc-400">{excerpt.label}</p>
              {excerpt.loading && (
                <p className="animate-pulse font-mono text-sm text-zinc-600">
                  Fetching from Flow blockchain…
                </p>
              )}
              {excerpt.error && !excerpt.loading && (
                <p className="font-mono text-sm text-red-400">{excerpt.error}</p>
              )}
              {excerpt.text && (
                <blockquote className="border-l-2 border-emerald-500/50 pl-4 font-serif text-lg italic leading-relaxed text-zinc-300">
                  {excerpt.text}
                </blockquote>
              )}
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

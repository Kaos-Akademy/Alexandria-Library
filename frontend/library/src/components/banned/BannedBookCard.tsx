import Link from 'next/link'
import {
  type BannedBookProfile,
  getBanSummaryQuote,
  getBookEraKey,
  getLibraryBookUrl,
} from '@/lib/bannedBooksData'

const ERA_LABELS: Record<string, string> = {
  '16-17': '16th–17th Century Archive',
  '18': '18th Century Archive',
  '19': '19th Century Archive',
  '20': '20th Century Archive',
  modern: 'Modern Archive',
}

interface BannedBookCardProps {
  book: BannedBookProfile
}

export default function BannedBookCard({ book }: BannedBookCardProps) {
  const eraKey = getBookEraKey(book)
  const eraLabel = ERA_LABELS[eraKey] ?? book.era

  return (
    <article className="group flex flex-col justify-between overflow-hidden rounded-lg border border-white/[0.08] bg-[#1a1a2e] shadow-xl transition-all duration-200 hover:-translate-y-1 hover:border-emerald-400/60">
      <div
        className="relative flex min-h-[260px] flex-col justify-between overflow-hidden border-b border-white/[0.06] p-6"
        style={{
          background: `linear-gradient(135deg, ${book.coverColor} 0%, ${book.coverColor}cc 45%, #24070d 100%)`,
        }}
      >
        <div className="pointer-events-none absolute -bottom-8 -right-6 select-none font-serif text-[110px] font-bold text-white/[0.03]">
          {book.yearWritten}
        </div>
        <div className="relative z-10 flex items-start justify-between">
          <span className="rounded border border-white/10 bg-black/40 px-2 py-0.5 font-mono text-[11px] uppercase tracking-wider text-orange-200/90">
            {eraLabel}
          </span>
          <div className="-rotate-6 border border-dashed border-white/80 bg-[#c0392b] px-2.5 py-1 font-mono text-[11px] font-bold uppercase tracking-widest text-white shadow-md">
            Banned
          </div>
        </div>
        <div className="relative z-10 my-auto py-4">
          <h2 className="font-serif text-xl font-semibold leading-tight text-white drop-shadow-md transition-colors group-hover:text-emerald-200">
            {book.title}
          </h2>
        </div>
        <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-2 text-white/50">
          <span className="font-mono text-xs text-orange-200/80">{book.author}</span>
          <span className="font-mono text-xs font-bold text-emerald-200">
            #{book.yearWritten}
          </span>
        </div>
      </div>

      <div className="flex flex-grow flex-col justify-between gap-4 p-6">
        <div>
          <div className="mb-1 flex items-center justify-between font-mono text-xs text-zinc-400">
            <span>AUTHOR: {book.author.toUpperCase()}</span>
            <span className="font-semibold text-zinc-200">{book.yearWritten} C.E.</span>
          </div>
          <p className="my-2 border-l-2 border-[#c0392b] bg-zinc-900/40 py-1 pl-3 font-serif text-sm italic text-zinc-400">
            {getBanSummaryQuote(book)}
          </p>
        </div>
        <div className="flex flex-col gap-3 border-t border-white/[0.06] pt-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href={`/banned-books/${book.slug}`}
            className="inline-flex min-h-[44px] items-center gap-1 text-sm font-semibold text-emerald-400 transition-all hover:underline"
          >
            Learn More <span className="text-xs">→</span>
          </Link>
          <Link
            href={getLibraryBookUrl(book)}
            className="inline-flex min-h-[44px] items-center justify-center gap-1 rounded border border-white/20 px-4 font-mono text-xs uppercase tracking-wider text-white transition-colors hover:border-emerald-400 hover:text-emerald-400"
          >
            Read On-Chain →
          </Link>
        </div>
      </div>
    </article>
  )
}

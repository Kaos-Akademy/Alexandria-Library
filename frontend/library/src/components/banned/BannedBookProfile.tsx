import Link from 'next/link'
import type { BannedBookProfile } from '@/lib/bannedBooksData'
import { getLibraryBookUrl } from '@/lib/bannedBooksData'
import BanTimeline from '@/components/banned/BanTimeline'
import AuthorProfile from '@/components/banned/AuthorProfile'
import EditorialSection from '@/components/banned/EditorialSection'
import OnChainExcerpts from '@/components/banned/OnChainExcerpts'

interface BannedBookProfileViewProps {
  book: BannedBookProfile
}

export default function BannedBookProfileView({ book }: BannedBookProfileViewProps) {
  const readUrl = getLibraryBookUrl(book)
  const manifestoLine = book.whatBanReveals.split('.')[0]?.trim()

  return (
    <div className="min-h-screen bg-[#0e0e15] text-zinc-200">
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#0e0e15] py-16 md:py-24">
        <div className="pointer-events-none absolute inset-0 flex flex-col justify-around opacity-[0.06]">
          {[...Array(6)].map((_, i) => (
            <div key={i} className={`h-1 bg-zinc-200 ${i % 2 ? 'w-3/4' : 'w-full'}`} />
          ))}
        </div>
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
            <Link
              href="/banned-books"
              className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-widest text-emerald-400 hover:text-emerald-300"
            >
              ← Banned Books Archive
            </Link>
            <span className="max-w-full break-all text-right font-mono text-xs uppercase tracking-wider text-zinc-500 sm:max-w-[50%]">
              On-chain · {book.onChainTitle}
            </span>
          </div>

          <div className="relative mx-auto flex max-w-4xl flex-col items-center text-center">
            <div className="mb-4 md:absolute md:-top-4 md:right-0 md:z-20 md:-rotate-6 md:right-16">
              <div className="inline-flex items-center gap-1 rounded bg-red-900 px-4 py-2 font-mono text-[11px] uppercase tracking-widest text-red-100 shadow-lg">
                Banned Record #{book.yearWritten}
              </div>
            </div>

            <p className="mb-2 font-mono text-xs uppercase tracking-widest text-zinc-500">
              {book.author} · {book.yearWritten} · {book.nationality}
            </p>
            <h1 className="mb-6 font-serif text-4xl font-bold tracking-tight text-white md:text-6xl">
              {book.title}
            </h1>

            <div className="relative my-8 max-w-2xl px-4">
              <span className="pointer-events-none absolute -left-4 -top-8 select-none font-serif text-7xl leading-none text-emerald-500/20">
                &ldquo;
              </span>
              <blockquote className="font-serif text-xl italic leading-relaxed text-zinc-200 md:text-2xl">
                {book.pullQuote}
              </blockquote>
              <cite className="mt-4 block font-mono text-xs uppercase tracking-wider text-zinc-500 not-italic">
                — {book.pullQuoteAttribution}
              </cite>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link
                href={readUrl}
                className="inline-flex items-center gap-2 rounded bg-gradient-to-r from-emerald-600 via-purple-700 to-orange-700 px-8 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-lg transition-opacity hover:opacity-95"
              >
                Read This Book On-Chain
              </Link>
              <Link
                href="/banned-books"
                className="inline-flex items-center gap-2 rounded bg-zinc-800 px-8 py-3 text-xs font-semibold uppercase tracking-wider text-zinc-200 transition-colors hover:bg-zinc-700"
              >
                Back to Archive
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* The Ban */}
      <section className="bg-[#f8f7f3] py-16 text-zinc-900 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="mb-10 max-w-3xl">
            <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-emerald-800">
              The Ban
            </span>
            <h2 className="font-serif text-3xl font-semibold md:text-4xl">
              When and Where It Was Banned
            </h2>
          </div>
          <BanTimeline events={book.banHistory} />
          <div className="mt-12 flex max-w-4xl flex-col items-center justify-between gap-4 rounded bg-[#efece4] p-6 md:flex-row">
            <span className="text-sm font-semibold uppercase tracking-wider text-zinc-900">
              {book.banHistory.length} documented suppression event
              {book.banHistory.length !== 1 ? 's' : ''}
            </span>
            <span className="font-mono text-xs text-zinc-600">
              Archived with full challenge documentation on Flow
            </span>
          </div>
        </div>
      </section>

      {/* Writer's World */}
      <section className="bg-zinc-900 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <span className="mb-2 block font-mono text-[11px] uppercase tracking-widest text-zinc-500">
            The Writer&apos;s World
          </span>
          <h2 className="mb-10 font-serif text-3xl font-semibold text-white md:text-4xl">
            Who Wrote This, and What World Did They Inhabit?
          </h2>
          <AuthorProfile book={book} />
        </div>
      </section>

      <EditorialSection
        label="Why It Was Dangerous"
        title="Why This Book Made Power Uncomfortable"
        body={book.whyDangerous}
        variant="light"
      />

      <EditorialSection
        label="What the Ban Reveals"
        title="What Banning This Book Tells You"
        body={book.whatBanReveals}
        variant="accent"
        manifesto={manifestoLine ? `${manifestoLine}.` : undefined}
      />

      <EditorialSection
        label="Why Read It"
        title="Why This Book Still Matters"
        body={book.whyReadIt}
        variant="light"
      />

      <OnChainExcerpts book={book} />

      {/* Read On-Chain CTA */}
      <section className="border-t border-zinc-800 bg-[#0e0e15] py-16 md:py-20">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-3 block font-mono text-[11px] uppercase tracking-widest text-emerald-500">
            Immutable · Uncensorable · Free
          </span>
          <h2 className="mb-4 font-serif text-3xl font-bold text-white md:text-4xl">
            Read {book.title} On-Chain
          </h2>
          <p className="mb-8 text-zinc-400">
            This book was silenced. It now lives permanently on the Flow blockchain — free to read,
            impossible to erase.
          </p>
          <Link
            href={readUrl}
            className="inline-flex items-center gap-2 rounded bg-emerald-600 px-10 py-4 text-sm font-semibold uppercase tracking-wider text-white transition-colors hover:bg-emerald-500"
          >
            Open in Alexandria Library →
          </Link>
        </div>
      </section>
    </div>
  )
}

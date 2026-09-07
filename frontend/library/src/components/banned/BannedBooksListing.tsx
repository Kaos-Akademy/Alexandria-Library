'use client'

import { useMemo, useState } from 'react'
import {
  bannedBooks,
  type BanReason,
  type EraFilterKey,
  getBookBanReasons,
  getBookEraKey,
  getLatestBanYear,
} from '@/lib/bannedBooksData'
import BannedBookCard from '@/components/banned/BannedBookCard'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { useIsMobile } from '@/lib/useMediaQuery'

type SortOption = 'chronological' | 'az' | 'recent'

const ERA_FILTERS: { key: EraFilterKey | 'all'; label: string }[] = [
  { key: 'all', label: 'All Eras' },
  { key: '16-17', label: '16th–17th Century' },
  { key: '18', label: '18th Century' },
  { key: '19', label: '19th Century' },
  { key: '20', label: '20th Century' },
  { key: 'modern', label: 'Modern' },
]

const REASON_FILTERS: { key: BanReason | 'all'; label: string }[] = [
  { key: 'all', label: 'All Reasons' },
  { key: 'political', label: 'Political' },
  { key: 'religious', label: 'Religious' },
  { key: 'sexual', label: 'Sexual / Body' },
  { key: 'racial', label: 'Racial' },
  { key: 'lgbtq', label: 'LGBTQ+' },
]

function filterPillClass(active: boolean, variant: 'era' | 'reason') {
  const base =
    'min-h-[44px] rounded-full border px-4 py-2.5 font-mono text-xs uppercase transition-all'
  if (active) {
    return variant === 'era'
      ? `${base} border-emerald-500 bg-emerald-500 font-bold text-zinc-950`
      : `${base} border-red-700 bg-red-900 font-bold text-red-100`
  }
  return `${base} border-zinc-700 bg-zinc-900 text-zinc-400 hover:border-zinc-500 hover:text-zinc-200`
}

function FilterControls({
  eraFilter,
  reasonFilter,
  search,
  sort,
  onEraChange,
  onReasonChange,
  onSearchChange,
  onSortChange,
}: {
  eraFilter: EraFilterKey | 'all'
  reasonFilter: BanReason | 'all'
  search: string
  sort: SortOption
  onEraChange: (v: EraFilterKey | 'all') => void
  onReasonChange: (v: BanReason | 'all') => void
  onSearchChange: (v: string) => void
  onSortChange: (v: SortOption) => void
}) {
  return (
    <div className="flex w-full flex-col gap-4">
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase text-zinc-500">Era</span>
        <div className="flex flex-wrap gap-2">
          {ERA_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onEraChange(key)}
              className={filterPillClass(eraFilter === key, 'era')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <span className="font-mono text-xs uppercase text-zinc-500">Ban reason</span>
        <div className="flex flex-wrap gap-2">
          {REASON_FILTERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => onReasonChange(key)}
              className={filterPillClass(reasonFilter === key, 'reason')}
            >
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative w-full sm:flex-1">
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">⌕</span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by title or author..."
            className="min-h-[44px] w-full rounded border border-zinc-700/60 bg-zinc-900 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-emerald-500 focus:outline-none"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as SortOption)}
          className="min-h-[44px] w-full cursor-pointer appearance-none rounded border border-zinc-700/60 bg-zinc-900 py-2 pl-3 pr-8 font-mono text-xs text-zinc-400 focus:border-emerald-500 focus:outline-none sm:w-auto sm:min-w-[180px]"
        >
          <option value="chronological">Sort: Chronological</option>
          <option value="az">Sort: Title A–Z</option>
          <option value="recent">Sort: Most Recent Ban</option>
        </select>
      </div>
    </div>
  )
}

export default function BannedBooksListing() {
  const isMobile = useIsMobile()
  const [eraFilter, setEraFilter] = useState<EraFilterKey | 'all'>('all')
  const [reasonFilter, setReasonFilter] = useState<BanReason | 'all'>('all')
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState<SortOption>('chronological')
  const [filtersOpen, setFiltersOpen] = useState(false)

  const filterSummary = useMemo(() => {
    const parts: string[] = []
    if (eraFilter !== 'all') {
      parts.push(ERA_FILTERS.find((f) => f.key === eraFilter)?.label ?? eraFilter)
    }
    if (reasonFilter !== 'all') {
      parts.push(REASON_FILTERS.find((f) => f.key === reasonFilter)?.label ?? reasonFilter)
    }
    if (search.trim()) parts.push(`"${search.trim()}"`)
    return parts.length ? parts.join(' · ') : 'All books'
  }, [eraFilter, reasonFilter, search])

  const filteredBooks = useMemo(() => {
    const q = search.trim().toLowerCase()

    let results = bannedBooks.filter((book) => {
      const matchesEra = eraFilter === 'all' || getBookEraKey(book) === eraFilter
      const reasons = getBookBanReasons(book)
      const matchesReason = reasonFilter === 'all' || reasons.includes(reasonFilter)
      const matchesSearch =
        !q ||
        book.title.toLowerCase().includes(q) ||
        book.author.toLowerCase().includes(q)
      return matchesEra && matchesReason && matchesSearch
    })

    results = [...results].sort((a, b) => {
      if (sort === 'az') return a.title.localeCompare(b.title)
      if (sort === 'recent') return getLatestBanYear(b) - getLatestBanYear(a)
      return a.yearWritten - b.yearWritten
    })

    return results
  }, [eraFilter, reasonFilter, search, sort])

  return (
    <div className="min-h-screen bg-[#0e0e15] text-zinc-200">
      <section className="relative overflow-hidden border-b border-zinc-800 bg-[#0e0e15] py-12 md:py-20">
        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center sm:px-6 lg:px-8">
          <div className="mb-4 flex items-center justify-center gap-2">
            <span className="font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-zinc-500">
              The Alexandria Library · Immutable Depository
            </span>
          </div>
          <h1 className="mb-4 font-serif text-3xl font-bold tracking-tight text-white sm:text-4xl md:text-6xl">
            Books That Were Silenced
          </h1>
          <p className="mx-auto mb-8 max-w-2xl font-mono text-sm leading-relaxed text-zinc-400 md:text-base">
            Every book on this page was removed, burned, or banned. Every one is free to read here.
          </p>
          <div className="inline-flex items-center gap-2 rounded border border-emerald-500/30 bg-zinc-900 px-4 py-2">
            <span className="font-mono text-xs font-bold uppercase tracking-wider text-emerald-400">
              {bannedBooks.length} books · and counting
            </span>
          </div>
        </div>
      </section>

      <section className="sticky-below-nav sticky z-40 border-b border-emerald-500/30 bg-[#0d0d14]/95 py-3 shadow-lg backdrop-blur-xl md:py-4">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {isMobile ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <p className="min-w-0 flex-1 truncate font-mono text-xs text-zinc-400">
                  Filters: {filterSummary}
                </p>
                <button
                  type="button"
                  onClick={() => setFiltersOpen(true)}
                  className="touch-target shrink-0 rounded border border-emerald-500/40 bg-zinc-900 px-4 text-xs font-semibold uppercase tracking-wide text-emerald-400"
                >
                  Edit filters
                </button>
              </div>
              <Dialog open={filtersOpen} onOpenChange={setFiltersOpen}>
                <DialogContent className="max-h-[85dvh] overflow-y-auto border-zinc-700 bg-[#13131f] text-zinc-100 sm:max-w-lg">
                  <DialogHeader>
                    <DialogTitle className="font-serif text-lg text-white">Filter banned books</DialogTitle>
                  </DialogHeader>
                  <FilterControls
                    eraFilter={eraFilter}
                    reasonFilter={reasonFilter}
                    search={search}
                    sort={sort}
                    onEraChange={setEraFilter}
                    onReasonChange={setReasonFilter}
                    onSearchChange={setSearch}
                    onSortChange={setSort}
                  />
                  <button
                    type="button"
                    onClick={() => setFiltersOpen(false)}
                    className="mt-2 min-h-[44px] w-full rounded bg-emerald-600 text-sm font-semibold text-white"
                  >
                    Show {filteredBooks.length} books
                  </button>
                </DialogContent>
              </Dialog>
            </div>
          ) : (
            <FilterControls
              eraFilter={eraFilter}
              reasonFilter={reasonFilter}
              search={search}
              sort={sort}
              onEraChange={setEraFilter}
              onReasonChange={setReasonFilter}
              onSearchChange={setSearch}
              onSortChange={setSort}
            />
          )}
        </div>
      </section>

      <section className="bg-[#111118] py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {filteredBooks.length === 0 ? (
            <p className="py-16 text-center text-zinc-500">
              No books match your filters. Try adjusting era, reason, or search.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {filteredBooks.map((book) => (
                <BannedBookCard key={book.slug} book={book} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}

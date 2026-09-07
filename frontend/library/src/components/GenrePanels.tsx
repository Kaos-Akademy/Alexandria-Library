'use client'
import Link from 'next/link'
import { useMemo } from 'react'
import { bannedTitleToSlug, bannedTitles } from '@/lib/bannedBooksData'

type GenreWithBooks = { genre: string; books: string[] | null }

type Props = {
  data: GenreWithBooks[]
  genreFilter: string
  onGenreFilterChange: (genre: string) => void
  searchQuery: string
  onSearchChange: (query: string) => void
  onSelectBook: (title: string) => void
}

function BannedBadge({ title }: { title: string }) {
  const slug = bannedTitleToSlug.get(title)
  if (!slug) return null
  return (
    <Link
      href={`/banned-books/${slug}`}
      onClick={(e) => e.stopPropagation()}
      className="ml-2 inline-flex shrink-0 items-center rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 hover:bg-amber-200 transition-colors"
    >
      Banned
    </Link>
  )
}

export default function GenrePanels({
  data,
  genreFilter,
  onGenreFilterChange,
  searchQuery,
  onSearchChange,
  onSelectBook,
}: Props) {
  const sortedGenres = useMemo(() => {
    const list = data
      .filter((d) => Array.isArray(d.books) && (d.books?.length ?? 0) > 0)
      .map((d) => d.genre)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return list
  }, [data])

  const q = searchQuery.trim().toLowerCase()

  const panelsToShow = useMemo(() => {
    let list = sortedGenres
    if (genreFilter && sortedGenres.includes(genreFilter)) list = [genreFilter]
    if (!q) return list
    const getBooksForGenre = (genre: string) => {
      const books = data.find((d) => d.genre === genre)?.books ?? []
      return books.filter((t) => t.toLowerCase().includes(q))
    }
    return list.filter((genre) => {
      const genreMatches = genre.toLowerCase().includes(q)
      const books = getBooksForGenre(genre)
      return genreMatches || books.length > 0
    })
  }, [sortedGenres, genreFilter, data, q])

  const getBooks = (genre: string) => {
    const books = data.find((d) => d.genre === genre)?.books ?? []
    if (!q) return books
    return books.filter((t) => t.toLowerCase().includes(q))
  }

  return (
    <section className="w-full">
      {/* Search and genre: stacked on mobile, inline on larger screens */}
      <div className="flex flex-col gap-3 mb-5 sm:mb-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="book-search" className="text-sm font-medium text-gray-500 shrink-0">
            Search
          </label>
          <input
            id="book-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="By name, genre, or author..."
            aria-label="Search books by name, genre, or author"
            className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-800 placeholder:text-gray-400
              focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
              sm:flex-1 sm:max-w-[320px] sm:text-sm"
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label htmlFor="genre-filter" className="text-sm font-medium text-gray-500 shrink-0">
            Genre
          </label>
          <select
            id="genre-filter"
            value={genreFilter}
            onChange={(e) => onGenreFilterChange(e.target.value)}
            className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-800
              focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
              sm:w-auto sm:max-w-[260px] sm:text-sm"
          >
            <option value="">All genres</option>
            {sortedGenres.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Panels: 1 col mobile, 2 sm, 3 lg */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {panelsToShow.map((genre) => {
          const books = getBooks(genre)
          if (!books.length) return null
          return (
            <div
              key={genre}
              className="rounded-lg border border-gray-100 bg-white p-4 sm:p-4"
            >
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3 pb-2 border-b border-gray-100">
                {genre}
              </h2>
              <ul className="space-y-0">
                {books.map((title) => (
                  <li key={title}>
                    <div className="flex min-h-[44px] w-full items-center gap-2 rounded-md px-2 py-1 -mx-2 hover:bg-emerald-50">
                      <button
                        type="button"
                        onClick={() => onSelectBook(title)}
                        className="min-h-[44px] flex-1 text-left text-[15px] text-gray-800 hover:text-emerald-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 sm:text-sm"
                      >
                        {title}
                      </button>
                      {bannedTitles.has(title) && <BannedBadge title={title} />}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )
        })}
      </div>
    </section>
  )
}

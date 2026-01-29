import { useMemo } from 'react'

type GenreWithBooks = { genre: string; books: string[] | null }

type Props = {
  data: GenreWithBooks[]
  genreFilter: string
  onGenreFilterChange: (genre: string) => void
  onSelectBook: (title: string) => void
}

export default function GenrePanels({
  data,
  genreFilter,
  onGenreFilterChange,
  onSelectBook,
}: Props) {
  const sortedGenres = useMemo(() => {
    const list = data
      .filter((d) => Array.isArray(d.books) && (d.books?.length ?? 0) > 0)
      .map((d) => d.genre)
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
    return list
  }, [data])

  const panelsToShow = useMemo(() => {
    if (!genreFilter) return sortedGenres
    return sortedGenres.includes(genreFilter) ? [genreFilter] : []
  }, [sortedGenres, genreFilter])

  const getBooks = (genre: string) =>
    data.find((d) => d.genre === genre)?.books ?? []

  return (
    <section className="w-full">
      {/* Genre filter: full width on mobile, inline on larger screens */}
      <div className="flex flex-col gap-2 mb-5 sm:mb-4 sm:flex-row sm:items-center sm:gap-3">
        <label htmlFor="genre-filter" className="text-sm font-medium text-gray-500">
          Genre
        </label>
        <select
          id="genre-filter"
          value={genreFilter}
          onChange={(e) => onGenreFilterChange(e.target.value)}
          className="w-full min-h-[44px] rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-base text-gray-800
            focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20
            sm:min-h-0 sm:w-auto sm:max-w-[260px] sm:py-2 sm:text-sm"
        >
          <option value="">All genres</option>
          {sortedGenres.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </select>
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
                    <button
                      type="button"
                      onClick={() => onSelectBook(title)}
                      className="min-h-[44px] w-full text-left py-2.5 px-3 -mx-3 rounded-md text-[15px] text-gray-800
                        active:bg-gray-100
                        sm:min-h-0 sm:py-1.5 sm:px-2 sm:-mx-2 sm:text-sm
                        hover:bg-emerald-50 hover:text-emerald-800
                        focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:ring-inset"
                    >
                      {title}
                    </button>
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

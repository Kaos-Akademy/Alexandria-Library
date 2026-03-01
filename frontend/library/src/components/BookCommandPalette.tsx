import { useMemo, useRef, useState } from 'react'
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'

type GenreWithBooks = { genre: string; books: string[] | null }

type Props = {
  data: GenreWithBooks[]
  authors?: string[]
  open?: boolean
  onOpenChange?: (open: boolean) => void
  onSelectBook: (title: string) => void
  onSelectAuthor?: (author: string) => void
  inline?: boolean
}

export default function BookCommandPalette({
  data,
  authors = [],
  open = false,
  onOpenChange,
  onSelectBook,
  onSelectAuthor,
  inline = false,
}: Props) {
  const [cmdQuery, setCmdQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)
  const [expanded, setExpanded] = useState(false)
  const blurTimerRef = useRef<number | null>(null)

  const allBooks = useMemo(() => {
    const titles: string[] = []
    for (const { books } of data) {
      if (Array.isArray(books)) {
        for (const title of books) titles.push(title)
      }
    }
    const seen = new Set<string>()
    const unique: string[] = []
    for (const t of titles) {
      if (!seen.has(t)) { seen.add(t); unique.push(t) }
    }
    return unique
  }, [data])

  const filteredBooks = useMemo(() => {
    const source: string[] = activeGenre
      ? (data.find((d) => d.genre === activeGenre)?.books ?? []).filter(Boolean) as string[]
      : allBooks
    const q = cmdQuery.trim().toLowerCase()
    if (!q) return source
    const prefixMatches: string[] = []
    const substringMatches: string[] = []
    for (const title of source) {
      const lc = title.toLowerCase()
      if (lc.startsWith(q)) prefixMatches.push(title)
      else if (lc.includes(q)) substringMatches.push(title)
    }
    return [...prefixMatches, ...substringMatches]
  }, [cmdQuery, allBooks, activeGenre, data])

  const filteredAuthors = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase()
    if (!q) return authors
    const prefix: string[] = []
    const substr: string[] = []
    for (const a of authors) {
      const lc = (a || '').toLowerCase()
      if (lc.startsWith(q)) prefix.push(a)
      else if (lc.includes(q)) substr.push(a)
    }
    return [...prefix, ...substr]
  }, [authors, cmdQuery])

  const filteredGenres = useMemo(() => {
    const q = cmdQuery.trim().toLowerCase()
    const genres = data.map((d) => d.genre)
    if (!q) return genres
    const prefix: string[] = []
    const substr: string[] = []
    for (const g of genres) {
      const lc = (g || '').toLowerCase()
      if (lc.startsWith(q)) prefix.push(g)
      else if (lc.includes(q)) substr.push(g)
    }
    return [...prefix, ...substr]
  }, [cmdQuery, data])

  const content = (
    <>
      <CommandInput
        placeholder="Search books or authors..."
        onValueChange={setCmdQuery}
        onFocus={() => setExpanded(true)}
        onBlur={() => {
          if (blurTimerRef.current) window.clearTimeout(blurTimerRef.current)
          blurTimerRef.current = window.setTimeout(() => setExpanded(false), 120)
        }}
      />
      {expanded && (
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading={activeGenre ? `Books in ${activeGenre}` : 'Books'}>
          {filteredBooks.map((title) => (
            <CommandItem
              key={title}
              value={title}
              onSelect={(value) => {
                if (onOpenChange) {
                  onOpenChange(false)
                }
                onSelectBook(value)
                setExpanded(false)
              }}
            >
              {title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        {filteredAuthors.length > 0 && (
          <>
            <CommandGroup heading="Authors">
              {filteredAuthors.map((author) => (
                <CommandItem
                  key={author}
                  value={author}
                  onSelect={(value) => {
                    if (onOpenChange) {
                      onOpenChange(false)
                    }
                    if (onSelectAuthor) {
                      onSelectAuthor(value)
                    }
                    setExpanded(false)
                  }}
                >
                  {author}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandSeparator />
          </>
        )}
        <CommandGroup heading="Genres">
          {activeGenre && (
            <CommandItem value="All genres" onSelect={() => setActiveGenre(null)}>
              All genres
            </CommandItem>
          )}
          {filteredGenres.map((genre) => (
            <CommandItem
              key={genre}
              value={genre}
              onSelect={(value) => {
                setActiveGenre(value)
              }}
            >
              {genre}
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
      )}
    </>
  )

  if (inline) {
    if (!expanded) {
      return (
        <div className="mb-6">
          <button
            type="button"
            className="w-full max-w-[680px] mx-auto flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm text-gray-500 bg-white shadow-sm"
            onClick={() => setExpanded(true)}
          >
            <span className="opacity-70">Search books or authors…</span>
          </button>
        </div>
      )
    }
    return (
      <div className="mb-6">
        <Command className="rounded-lg border shadow-md md:min-w-[450px]">
          {content}
        </Command>
      </div>
    )
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      {content}
    </CommandDialog>
  )
}



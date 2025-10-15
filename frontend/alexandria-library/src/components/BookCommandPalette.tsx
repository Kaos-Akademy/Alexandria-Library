import { useMemo, useState } from 'react'
import {
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
  open: boolean
  onOpenChange: (open: boolean) => void
  onSelectBook: (title: string) => void
}

export default function BookCommandPalette({ data, open, onOpenChange, onSelectBook }: Props) {
  const [cmdQuery, setCmdQuery] = useState('')
  const [activeGenre, setActiveGenre] = useState<string | null>(null)

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

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Type a command or search..." onValueChange={setCmdQuery} />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading={activeGenre ? `Books in ${activeGenre}` : 'Books'}>
          {filteredBooks.map((title) => (
            <CommandItem
              key={title}
              value={title}
              onSelect={(value) => {
                onOpenChange(false)
                onSelectBook(value)
              }}
            >
              {title}
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
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
    </CommandDialog>
  )
}



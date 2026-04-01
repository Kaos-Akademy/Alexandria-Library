import { getGenres } from "./scripts/getGenres"
import { getBooksByGenre } from "./scripts/getBooksByGenre"
import { getBookChapters } from "./scripts/getBookChapters"
import { getBookChapterByTitle } from "./scripts/getBookChapterByTitle"
import { getBookAuthor } from "./scripts/getBookAuthor"
import { getChapterParagraph } from "./scripts/getChapterParagraph"
import { getChapterTitles } from "./scripts/getChapterTitles"
import { getAuthors } from "./scripts/getAuthors"
import { getBooksByAuthor } from "./scripts/getBooksByAuthor"

// Note: These functions use the low-level FCL for backwards compatibility
// The Flow React SDK hooks should be used in components instead
import { fcl } from '@/lib/flowFclConfig'

export const fetchGenres = async () => {
    const response = await fcl.query({
        cadence: getGenres(),
        args: () => [],
    });
    return response;
};

export const fetchBooksByGenre = async (genre: string) => {
    const response = await fcl.query({
        cadence: getBooksByGenre(),
        args: (arg, t) => [arg(genre, t.String)],
    });
    return response;
};

export const fetchChapterTitles = async (bookTitle: string) => {
    const response = await fcl.query({
        cadence: getChapterTitles(),
        args: (arg, t) => [arg(bookTitle, t.String)],
    });
    return response;
};

export const fetchAuthors = async (): Promise<string[]> => {
    const response = await fcl.query({
        cadence: getAuthors(),
        args: () => [],
    });
    if (!Array.isArray(response)) return []
    return response.filter((a): a is string => typeof a === 'string' && a.length > 0)
};

export const fetchBooksByAuthor = async (author: string): Promise<string[] | null> => {
    const response = await fcl.query({
        cadence: getBooksByAuthor(),
        args: (arg, t) => [arg(author, t.String)],
    });
    if (!Array.isArray(response)) return null
    return response.filter((t): t is string => typeof t === 'string' && t.length > 0)
};
export const getGenresWithBooks = async (): Promise<Array<{ genre: string; books: string[] | null }>> => {
    const genres: unknown = await fetchGenres();
    if (!Array.isArray(genres)) return [];

    const results = await Promise.all(
        genres.map(async (genre: unknown) => {
            const genreStr = String(genre);
            try {
                const books = await fetchBooksByGenre(genreStr);
                return { genre: genreStr, books: Array.isArray(books) ? books : null };
            } catch (e) {
                console.error(e)
                return { genre: genreStr, books: null };
            }
        })
    );

    return results;
};

export const fetchChapterParagraph = async (bookTitle: string, chapterTitle: string, paragraphIndex: number) => {
    const response = await fcl.query({
        cadence: getChapterParagraph(),
        args: (arg, t) => [
            arg(bookTitle, t.String),
            arg(chapterTitle, t.String),
            arg(String(paragraphIndex), t.Int),
        ],
    });
    return response;
};

/** One paragraph per script — fallback when getBookChapter is empty or fails. */
async function loadChapterParagraphsSequential(
    bookTitle: string,
    chapterTitle: string,
    startIndex = 0,
    maxParagraphs = 50000
): Promise<string[]> {
    const out: string[] = []
    const end = startIndex + maxParagraphs
    for (let i = startIndex; i < end; i++) {
        try {
            const p = await fetchChapterParagraph(bookTitle, chapterTitle, i)
            if (typeof p !== 'string') break
            out.push(p)
        } catch {
            break
        }
    }
    return out
}

export interface BookChapterEntry {
    bookTitle: string;
    chapterTitle: string;
    index: string | number;
    paragraphs: string[];
    extra?: Record<string, unknown>;
}

export interface BookChaptersResponse {
    Author?: string;
    Chapters: Record<string, BookChapterEntry>;
}

export const fetchBookChapters = async (bookTitle: string): Promise<BookChaptersResponse> => {
    const response = await fcl.query({
        cadence: getBookChapters(),
        args: (arg, t) => [arg(bookTitle, t.String)],
    });
    return response as BookChaptersResponse;
};

/** Loads one chapter: try Alexandria.getBookChapter, else per-paragraph fetch. */
export const fetchBookChapterByTitle = async (
    bookTitle: string,
    chapterTitle: string
): Promise<string[]> => {
    try {
        const response = await fcl.query({
            cadence: getBookChapterByTitle(),
            args: (arg, t) => [arg(bookTitle, t.String), arg(chapterTitle, t.String)],
        })
        if (response != null) {
            const raw = response as { paragraphs?: unknown }
            const arr = raw?.paragraphs
            if (Array.isArray(arr)) {
                const batch = arr.filter((p): p is string => typeof p === 'string')
                if (batch.length > 0) return batch
            }
        }
    } catch {
        // fall through to sequential
    }
    return loadChapterParagraphsSequential(bookTitle, chapterTitle, 0)
};

async function fetchBookAuthorByTitle(bookTitle: string): Promise<string | undefined> {
    try {
        const response = await fcl.query({
            cadence: getBookAuthor(),
            args: (arg, t) => [arg(bookTitle, t.String)],
        });
        return typeof response === "string" ? response : undefined;
    } catch {
        return undefined;
    }
}

export interface LibraryStats {
    authors: number
    genres: number
    books: number
    authorNames?: string[]
    genreNames?: string[]
    bookTitles?: string[]
}

export const fetchLibraryStats = async (): Promise<LibraryStats> => {
    const [authors, genresWithBooks] = await Promise.all([
        fetchAuthors(),
        getGenresWithBooks(),
    ])
    const genreNames = Array.isArray(genresWithBooks) ? genresWithBooks.map((g) => g.genre) : []
    const allBooks = new Set<string>()
    for (const { books } of genresWithBooks ?? []) {
        if (Array.isArray(books)) {
            for (const b of books) if (b) allBooks.add(b)
        }
    }
    return {
        authors: authors.length,
        genres: genreNames.length,
        books: allBooks.size,
        authorNames: authors,
        genreNames,
        bookTitles: Array.from(allBooks),
    }
}

export interface RandomQuoteResult {
    quote: string
    bookTitle: string
    author?: string
}

function isTextParagraph(p: string): boolean {
    if (!p || typeof p !== 'string') return false
    if (p.startsWith('data:') || p.length > 50000) return false
    return true
}

function extractQuote(paragraph: string, maxLen = 200): string {
    const trimmed = paragraph.trim()
    if (trimmed.length <= maxLen) return trimmed
    const match = trimmed.slice(0, maxLen + 50).match(/^(.+?[.!?])\s/)
    return match ? match[1].trim() : trimmed.slice(0, maxLen).trim() + '…'
}

export const fetchRandomQuote = async (): Promise<RandomQuoteResult | null> => {
    const stats = await fetchLibraryStats()
    const bookTitles = stats.bookTitles ?? []
    if (bookTitles.length === 0) return null

    const shuffled = [...bookTitles].sort(() => Math.random() - 0.5)
    for (let i = 0; i < Math.min(5, shuffled.length); i++) {
        try {
            const bookTitle = shuffled[i]
            const titles = await fetchChapterTitles(bookTitle)
            if (!Array.isArray(titles) || titles.length === 0) continue
            const chapterTitles = titles.filter((t): t is string => typeof t === 'string' && t.length > 0)
            const sampleTitles = chapterTitles.slice(0, Math.min(8, chapterTitles.length))
            const textParagraphs: { text: string; bookTitle: string }[] = []
            for (const ct of sampleTitles) {
                const arr = await fetchBookChapterByTitle(bookTitle, ct)
                if (!arr) continue
                for (const p of arr) {
                    if (isTextParagraph(p)) textParagraphs.push({ text: p, bookTitle })
                }
            }
            if (textParagraphs.length > 0) {
                const chosen = textParagraphs[Math.floor(Math.random() * textParagraphs.length)]
                const quote = extractQuote(chosen.text)
                if (quote.length > 20) {
                    const author = await fetchBookAuthorByTitle(bookTitle)
                    return {
                        quote,
                        bookTitle: chosen.bookTitle,
                        author,
                    }
                }
            }
        } catch {
            continue
        }
    }
    return null
}

export interface BookExcerptResult {
    bookTitle: string
    author?: string
    chapterTitles: string[]
    excerpt: string
    totalParagraphsFetched: number
}

function findChapterByTitleOrIndex(
    chapterTitles: string[],
    chapterTitleOrIndex?: string
): string | null {
    if (!chapterTitleOrIndex) return null
    const trimmed = chapterTitleOrIndex.trim().toLowerCase()
    const num = parseInt(trimmed, 10)
    if (!isNaN(num) && num >= 1 && num <= chapterTitles.length) {
        return chapterTitles[num - 1]
    }
    const exact = chapterTitles.find((t) => t.toLowerCase() === trimmed)
    if (exact) return exact
    const contains = chapterTitles.find((t) =>
        t.toLowerCase().includes(trimmed) || trimmed.includes(t.toLowerCase())
    )
    return contains ?? null
}

export const fetchBookExcerpt = async (
    bookTitle: string,
    maxParagraphs = 500,
    chapterTitleOrIndex?: string
): Promise<BookExcerptResult | null> => {
    try {
        const rawTitles = await fetchChapterTitles(bookTitle)
        if (!Array.isArray(rawTitles)) return null
        const chapterTitles = rawTitles.filter(
            (t): t is string => typeof t === 'string' && t.length > 0
        )
        if (chapterTitles.length === 0) return null

        const titlesToScan = chapterTitleOrIndex
            ? (() => {
                  const target = findChapterByTitleOrIndex(chapterTitles, chapterTitleOrIndex)
                  return target ? [target] : chapterTitles
              })()
            : chapterTitles

        const paragraphs: string[] = []
        for (const title of titlesToScan) {
            const arr = await fetchBookChapterByTitle(bookTitle, title)
            if (!arr) continue
            for (const p of arr) {
                if (isTextParagraph(p)) {
                    paragraphs.push(p)
                    if (paragraphs.length >= maxParagraphs) break
                }
            }
            if (paragraphs.length >= maxParagraphs) break
        }
        if (paragraphs.length === 0) return null
        const excerpt = paragraphs.join('\n\n').slice(0, 50000)
        const author = await fetchBookAuthorByTitle(bookTitle)
        return {
            bookTitle,
            author,
            chapterTitles,
            excerpt,
            totalParagraphsFetched: paragraphs.length,
        }
    } catch {
        return null
    }
}
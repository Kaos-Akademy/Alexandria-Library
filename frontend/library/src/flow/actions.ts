import { getGenres } from "./scripts/getGenres"
import { getBooksByGenre } from "./scripts/getBooksByGenre"
import { getBookChapters } from "./scripts/getBookChapters"
import { getChapterParagraph } from "./scripts/getChapterParagraph"
import { getChapterTitles } from "./scripts/getChapterTitles"
import { getAuthors } from "./scripts/getAuthors"
import { getBooksByAuthor } from "./scripts/getBooksByAuthor"

// Note: These functions use the low-level FCL for backwards compatibility
// The Flow React SDK hooks should be used in components instead
import * as fcl from '@onflow/fcl'

// Configure FCL for direct queries (used by legacy actions)
fcl.config({
    'accessNode.api': 'https://rest-mainnet.onflow.org',
    'flow.network': 'mainnet',
})

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
        args: (arg, t) => [arg(bookTitle, t.String), arg(chapterTitle, t.String), arg(paragraphIndex, t.Int)],
    });
    return response;
};

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
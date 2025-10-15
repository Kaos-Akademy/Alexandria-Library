import { getGenres } from "./scripts/getGenres"
import { getBooksByGenre } from "./scripts/getBooksByGenre"
import { getBookChapters } from "./scripts/getBookChapters"
import * as fcl from '@onflow/fcl';

fcl.config({
  'discovery.wallet': 'https://fcl-discovery.onflow.org/authn', // Endpoint set to Mainnet
  'accessNode.api': 'https://mainnet.onflow.org',
});

export const fetchGenres = async () => {
    const response = await fcl.query({
        cadence: getGenres(),
        args: () => [],
    });
    console.log(response)
    return response;
};

export const fetchBooksByGenre = async (genre: string) => {
    const response = await fcl.query({
        cadence: getBooksByGenre(),
        args: (arg, t) => [arg(genre, t.String)],
    });
    console.log(response)
    return response;
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
    console.log(response)
    return response as BookChaptersResponse;
};
import { getGenres } from "./scripts/getGenres"
import { getBooksByGenre } from "./scripts/getBooksByGenre"
import * as fcl from '@onflow/fcl';

fcl.config({
  'discovery.wallet': 'https://fcl-discovery.onflow.org/authn', // Endpoint set to Mainnet
  'accessNode.api': 'https://mainnet.onflow.org',
});

export const useGetGenres = async () => {
    const response = await fcl.query({
        cadence: getGenres(),
        args: () => [],
    });
    console.log(response)
    return response;
};

export const useGetBooksByGenre = async (genre: string) => {
    const response = await fcl.query({
        cadence: getBooksByGenre(),
        args: (arg, t) => [arg(genre, t.String)],
    });
    console.log(response)
    return response;
};

export const getGenresWithBooks = async (): Promise<Array<{ genre: string; books: string[] | null }>> => {
    const genres: unknown = await useGetGenres();
    if (!Array.isArray(genres)) return [];

    const results = await Promise.all(
        genres.map(async (genre: unknown) => {
            const genreStr = String(genre);
            try {
                const books = await useGetBooksByGenre(genreStr);
                return { genre: genreStr, books: Array.isArray(books) ? books : null };
            } catch (e) {
                return { genre: genreStr, books: null };
            }
        })
    );

    return results;
};
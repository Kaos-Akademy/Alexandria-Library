import { getGenres } from '@/flow/scripts/getGenres'
import { getBooksByGenre } from '@/flow/scripts/getBooksByGenre'
import { getAuthors } from '@/flow/scripts/getAuthors'
import { getBooksByAuthor } from '@/flow/scripts/getBooksByAuthor'
import { getChapterTitles } from '@/flow/scripts/getChapterTitles'
import { getChapterParagraph } from '@/flow/scripts/getChapterParagraph'
import { getBookChapters } from '@/flow/scripts/getBookChapters'

export const LIBRARY_ADDRESS = '0xfed1adffd14ea9d0'
export const ACCESS_NODE = 'https://rest-mainnet.onflow.org'

export interface ScriptEntry {
  name: string
  description: string
  args: string
  returns: string
  cadence: string
}

export const docsScripts: ScriptEntry[] = [
  {
    name: 'Get all genres',
    description: 'Returns all genres in the library catalog.',
    args: 'none',
    returns: '[String]?',
    cadence: getGenres().trim(),
  },
  {
    name: 'Get books by genre',
    description: 'Returns book titles for a given genre.',
    args: 'genre: String',
    returns: '[String]?',
    cadence: getBooksByGenre().trim(),
  },
  {
    name: 'Get all authors',
    description: 'Returns all authors in the library.',
    args: 'none',
    returns: '[String]?',
    cadence: getAuthors().trim(),
  },
  {
    name: 'Get books by author',
    description: 'Returns book titles for a given author.',
    args: 'author: String',
    returns: '[String]?',
    cadence: getBooksByAuthor().trim(),
  },
  {
    name: 'Get chapter titles',
    description: 'Returns chapter titles for a book.',
    args: 'bookTitle: String',
    returns: '[String]',
    cadence: getChapterTitles().trim(),
  },
  {
    name: 'Get book paragraph',
    description: 'Returns a single paragraph by book, chapter, and index.',
    args: 'bookTitle: String, chapterTitle: String, paragraphIndex: Int',
    returns: 'String',
    cadence: getChapterParagraph().trim(),
  },
  {
    name: 'Get book (reference)',
    description: 'Returns a reference to the full book resource (chapters, paragraphs).',
    args: 'bookTitle: String',
    returns: '&Alexandria.Book?',
    cadence: getBookChapters().trim(),
  },
]

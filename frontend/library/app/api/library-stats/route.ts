import { NextResponse } from 'next/server'
import { fetchLibraryStats } from '@/flow/actions'
import librarianFlowService from '@/services/Flow/librarian.service'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const [stats, contextResult] = await Promise.all([
      fetchLibraryStats(),
      librarianFlowService.getLibrarianContext(5),
    ])
    const journalEntries = contextResult.entries ?? []
    return NextResponse.json({
      stats: {
        authors: stats.authors,
        genres: stats.genres,
        books: stats.books,
        authorNames: stats.authorNames,
        genreNames: stats.genreNames,
        bookTitles: stats.bookTitles,
      },
      journalEntries,
    })
  } catch (err) {
    console.error('[library-stats]', err)
    return NextResponse.json(
      { error: 'Failed to fetch library stats' },
      { status: 500 }
    )
  }
}

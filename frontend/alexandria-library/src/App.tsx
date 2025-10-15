import './App.css'
import { getGenresWithBooks } from './flow/actions'
import { useEffect, useState } from 'react'

function App() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await getGenresWithBooks()
        if (!cancelled) setData(res)
      } catch (e) {
        if (!cancelled) setError(e as Error)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => { cancelled = true }
  }, [])

  if (loading) {
    return <div className="container mx-auto p-4">Loading genres and books...</div>
  }

  if (error) {
    return <div className="container mx-auto p-4">Error: {error.message}</div>
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Alexandria Library</h1>

      {data.length === 0 ? (
        <div>No genres found</div>
      ) : (
        <div className="space-y-8">
          {data.map(({ genre, books }) => (
            <div key={genre}>
              <h2 className="text-2xl font-semibold mb-3">{genre}</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.isArray(books) && books.length > 0 ? (
                  books.map((book) => (
                    <div key={book} className="p-4 bg-white shadow rounded">
                      {book}
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500">No books in this genre</div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default App

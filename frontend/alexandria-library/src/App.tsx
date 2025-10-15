import './App.css'
import { useGetGenres } from './flow/actions'

function App() {
  const { data: genres, isLoading, error } = useGetGenres();

  if (isLoading) {
    return <div>Loading genres...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Alexandria Library</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {genres && Array.isArray(genres) ? (
          genres.map((genre: string) => (
            <div key={genre} className="p-4 bg-white shadow rounded">
              {genre}
            </div>
          ))
        ) : (
          <div>No genres found</div>
        )}
      </div>

      <pre className="mt-4 p-4 bg-gray-100 rounded">
        {JSON.stringify(genres, null, 2)}
      </pre>
    </div>
  )
}

export default App

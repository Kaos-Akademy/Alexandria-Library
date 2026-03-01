import { Link } from 'react-router-dom'
import { docsScripts, LIBRARY_ADDRESS, ACCESS_NODE } from '@/docsScripts'

export default function Docs() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-4 sm:py-6 md:py-8">
        <div className="text-center mb-6 sm:mb-8">
          <Link to="/" className="text-3xl sm:text-5xl md:text-6xl lg:text-8xl font-bold alexandria-title block mb-2 sm:mb-4">
            Alexandria Library
          </Link>
          <p className="text-xs font-mono text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-purple-600">
            Knowledge belongs to everyone, forever.
          </p>
        </div>

        <div className="prose prose-sm sm:prose-base md:prose-lg max-w-none">
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-4 sm:mb-5 md:mb-6 text-gray-900">
            Developer docs
          </h1>

          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <p>
              Alexandria Library runs on the Flow blockchain. All catalog and book content is stored on-chain. Read access is permissionless: anyone can query the contract with Cadence scripts — no wallet or account required. Projects like <a href="https://flunks.net" target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 underline">Flunks.net</a> already compose on top of the library so users can read books from their apps.
            </p>

            <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 mb-2">Contract &amp; network</h2>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li><strong>Network:</strong> Flow mainnet</li>
              <li><strong>Contract address:</strong> <code className="text-xs sm:text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded break-all">{LIBRARY_ADDRESS}</code></li>
              <li><strong>Access node:</strong> <code className="text-xs sm:text-sm font-mono bg-gray-100 px-1.5 py-0.5 rounded break-all">{ACCESS_NODE}</code></li>
            </ul>
            <p className="text-sm">Use Cadence scripts to read data; no authentication is needed for reads.</p>

            <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 mb-2">Public API (Alexandria contract)</h2>
            <p className="text-sm">View functions you can call from scripts:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm font-mono">
              <li>getAllGenres() → [String]</li>
              <li>getGenre(genre: String) → [String]?</li>
              <li>getAuthors() → [String]?</li>
              <li>getAuthor(author: String) → [String]?</li>
              <li>getBook(bookTitle: String) → &amp;Book</li>
              <li>getBookChapterTitles(bookTitle: String) → [String]</li>
              <li>getBookChapter(bookTitle: String, chapterTitle: String) → Chapter?</li>
              <li>getBookParagraph(bookTitle: String, chapterTitle: String, paragraphIndex: Int) → String</li>
              <li>getKeeper(bookTitle: String) → Address?</li>
            </ul>

            <h2 className="text-base sm:text-lg font-bold text-gray-900 mt-6 mb-2">Cadence scripts</h2>
            <p className="text-sm">Copy-paste these scripts to read from the library from your app (e.g. with FCL <code className="font-mono bg-gray-100 px-1 rounded">fcl.query</code>).</p>
          </div>

          <div className="mt-6 space-y-6">
            {docsScripts.map((entry) => (
              <section key={entry.name} className="border border-gray-200 rounded-lg p-4 sm:p-5 bg-gray-50/50">
                <h3 className="text-sm sm:text-base font-bold text-gray-900 mb-1">{entry.name}</h3>
                <p className="text-xs sm:text-sm text-gray-600 mb-2">{entry.description}</p>
                <p className="text-xs font-mono text-gray-500 mb-2">
                  Args: {entry.args} → Returns: {entry.returns}
                </p>
                <pre className="text-[10px] sm:text-xs font-mono bg-gray-900 text-gray-100 p-3 sm:p-4 rounded overflow-x-auto overflow-y-auto max-h-[240px]">
                  <code>{entry.cadence}</code>
                </pre>
              </section>
            ))}
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <Link to="/" className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700 underline font-medium">
              ← Back to Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

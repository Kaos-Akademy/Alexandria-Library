import { Link } from 'react-router-dom'

export default function Roadmap() {
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
            2026 Roadmap
          </h1>

          <div className="space-y-4 sm:space-y-5 md:space-y-6 text-sm sm:text-base text-gray-700 leading-relaxed">
            <p>
              The goal of Alexandria Library for 2026 is to grow the on-chain collection to <strong className="text-gray-900">1,000 books</strong>. Every book added is permanently preserved on the Flow blockchain — free to read, impossible to erase, and verifiable by anyone.
            </p>

            <p>
              Reaching 1,000 books means building a real, durable archive of human knowledge that no single authority can take down or alter. It also demonstrates that decentralized preservation at scale is viable: the library, its verification node, and community governance are designed to sustain and expand the collection over time.
            </p>

            <p>
              Progress is driven by uploads from librarians and by reinvestment of node rewards into curating and adding new works. You can track progress on the main page and support the goal by <Link to="/donate" className="text-emerald-600 hover:text-emerald-700 underline font-medium">donating</Link> or by contributing to the library directly.
            </p>

            <p className="font-semibold text-base sm:text-lg text-gray-900">
              1,000 books in 2026 — one step toward a permanent, open library for everyone.
            </p>
          </div>

          <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t border-gray-200">
            <Link
              to="/"
              className="text-sm sm:text-base text-emerald-600 hover:text-emerald-700 underline font-medium"
            >
              ← Back to Library
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

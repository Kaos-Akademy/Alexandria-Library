import Link from 'next/link'
import { BookOpen } from 'lucide-react'

const AUTHORS = [
  {
    era: '18TH CENTURY · ENLIGHTENMENT EXILE',
    name: 'Voltaire',
    book: 'Candide (1759)',
    slug: 'candide',
    bio: "Wrote Candide while in exile, amid the Seven Years' War and the Lisbon earthquake. He mocked the Church and blind optimism in 160 pages. It was burned before most people could read it.",
    hash: '#9940',
  },
  {
    era: '19TH CENTURY · POST-RECONSTRUCTION USA',
    name: 'Kate Chopin',
    book: 'The Awakening (1899)',
    slug: 'the-awakening',
    bio: 'Wrote her masterpiece in post-Reconstruction America, where married women had almost no legal rights. Her protagonist dared to want — and to choose death over surrender. Chopin\'s career never recovered.',
    hash: '#1402',
  },
  {
    era: '19TH CENTURY · AMERICAN TRANSCENDENTALISM',
    name: 'Walt Whitman',
    book: 'Leaves of Grass (1855)',
    slug: 'leaves-of-grass',
    bio: 'Published at his own expense. Celebrated the body, labor, and same-sex attachment with equal reverence. The Boston District Attorney had it banned in 1882 for "obscene" passages. It is now one of the most important American poems ever written.',
    hash: '#7701',
  },
]

export default function WritersContext() {
  return (
    <section className="bg-[#13131f] py-24 px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-16">
          <span className="font-['Share_Tech_Mono'] text-xs text-gray-400 uppercase tracking-[0.3em] block">
            THE WORLD THEY WROTE IN
          </span>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white font-bold mt-2">
            They wrote the dangerous thing anyway.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {AUTHORS.map((author) => (
            <div
              key={author.name}
              className="bg-[#1a1a2e] p-7 rounded-r-lg shadow-xl relative overflow-hidden flex flex-col justify-between"
            >
              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#2ecc71]" />
              <div>
                <span className="font-['Share_Tech_Mono'] text-[11px] text-gray-400 uppercase tracking-wider block">
                  {author.era}
                </span>
                <h3 className="font-['Playfair_Display'] text-2xl text-white font-bold italic mt-2">
                  {author.name}
                </h3>
                <Link
                  href={`/banned-books/${author.slug}`}
                  className="font-['Playfair_Display'] text-sm text-[#2ecc71] underline block mt-1"
                >
                  {author.book}
                </Link>
                <p className="text-[15px] text-gray-400 mt-4 leading-relaxed">{author.bio}</p>
              </div>
              <div className="pt-6 mt-6 flex items-center justify-between">
                <span className="font-['Share_Tech_Mono'] text-xs text-[#2ecc71]">
                  FLOW // HASH {author.hash}
                </span>
                <BookOpen className="w-5 h-5 text-[#2ecc71]" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

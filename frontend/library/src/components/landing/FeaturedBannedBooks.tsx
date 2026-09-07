import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { bannedBooks } from '@/lib/bannedBooksData'
import BannedBookCard from '@/components/banned/BannedBookCard'

export default function FeaturedBannedBooks() {
  return (
    <section id="featured-books" className="bg-[#0d0d14] py-24 px-8 relative">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-14">
          <span className="font-['Share_Tech_Mono'] text-[11px] text-gray-400 uppercase tracking-[0.25em] block">
            IN OUR LIBRARY. ON-CHAIN. FOREVER.
          </span>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white font-bold mt-2">
            Books that were silenced. Now permanent.
          </h2>
          <p className="font-['Share_Tech_Mono'] text-xs text-[#2ecc71] mt-2 flex items-center justify-center gap-2">
            Scroll horizontally to explore archive →
          </p>
        </div>

        <div className="-mx-4 flex gap-6 overflow-x-auto px-4 pb-8 pt-2 snap-x snap-mandatory scrollbar-none [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {bannedBooks.map((book) => (
            <div key={book.slug} className="w-[85vw] max-w-[320px] shrink-0 snap-center">
              <BannedBookCard book={book} />
            </div>
          ))}
        </div>

        <div className="text-center mt-12">
          <Link
            href="/banned-books"
            className="font-['Share_Tech_Mono'] text-[#2ecc71] text-lg font-medium tracking-wider hover:underline inline-flex items-center gap-2"
          >
            View All Banned Books
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </section>
  )
}

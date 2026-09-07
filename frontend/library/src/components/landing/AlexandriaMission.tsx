'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getGenresWithBooks } from '@/flow/actions'
import { BadgeCheck } from 'lucide-react'

export default function AlexandriaMission() {
  const [data, setData] = useState<Array<{ genre: string; books: string[] | null }>>([])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const genresWithBooks = await getGenresWithBooks()
        if (!cancelled) setData(genresWithBooks)
      } catch (e) {
        console.error(e)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [])

  const bookCount = useMemo(() => {
    const seen = new Set<string>()
    for (const { books } of data) {
      if (Array.isArray(books)) {
        for (const t of books) if (t) seen.add(t)
      }
    }
    return seen.size
  }, [data])

  return (
    <section id="what-is-alexandria" className="bg-[#13131f] py-24 px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 space-y-4">
            <div className="w-12 h-1 bg-[#2ecc71] rounded-full mb-4" />
            <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white leading-tight font-bold">
              Books that cannot be erased.
            </h2>
            <p className="font-['Share_Tech_Mono'] text-xs text-gray-400 uppercase tracking-widest">
              A Decentralized Autonomous Sanctuary
            </p>
          </div>

          <div className="md:col-span-7 space-y-6 text-lg text-gray-200 leading-relaxed">
            <p className="bg-[#1f1f26]/40 p-5 rounded">
              Alexandria is a decentralized library built on the Flow blockchain. Every book is stored
              immutably on-chain — no server, no company, no government can remove it.
            </p>
            <p className="text-gray-400">
              Reading is free. Always. No account required. Just open a book and read.
            </p>
            <p className="text-gray-400">
              We started with banned books because they are the most important books to preserve. When
              an authority decrees a thought dangerous, humanity possesses a moral imperative to preserve
              it in open daylight.
            </p>
          </div>
        </div>

        <div className="mt-16 text-center">
          <div className="inline-flex items-center gap-3 bg-[#1a1a2e] text-[#2ecc71] px-8 py-3 rounded-full shadow-lg">
            <BadgeCheck className="w-6 h-6" />
            <span className="font-['Share_Tech_Mono'] text-2xl md:text-3xl font-bold tracking-wide">
              {bookCount > 0 ? bookCount.toLocaleString() : '—'} books preserved on-chain
            </span>
          </div>
          <Link
            href="#blockchain-architecture"
            className="font-['Share_Tech_Mono'] text-[#2ecc71] text-sm tracking-wider mt-5 hover:underline block"
          >
            How does it work? →
          </Link>
        </div>
      </div>
    </section>
  )
}

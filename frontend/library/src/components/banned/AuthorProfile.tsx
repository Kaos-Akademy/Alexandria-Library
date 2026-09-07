import type { BannedBookProfile } from '@/lib/bannedBooksData'

interface AuthorProfileProps {
  book: BannedBookProfile
}

export default function AuthorProfile({ book }: AuthorProfileProps) {
  const { authorBio, author } = book
  const paragraphs = authorBio.politicalContext.split('\n\n').filter(Boolean)

  return (
    <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
      <div className="relative overflow-hidden rounded bg-zinc-800 p-6 shadow-xl lg:col-span-4 lg:p-8">
        <div className="absolute bottom-0 left-0 top-0 w-1.5 bg-emerald-500" />
        <h3 className="mb-1 font-serif text-xl font-bold italic text-white">{author}</h3>
        <p className="mb-6 font-mono text-xs text-emerald-400">{authorBio.nationality}</p>

        <div className="mb-6 flex h-48 items-center justify-center overflow-hidden rounded bg-zinc-950 p-4">
          <svg className="h-28 w-28 text-emerald-500" fill="currentColor" viewBox="0 0 160 160" aria-hidden>
            <path
              d="M80 10 C41.34 10 10 41.34 10 80 C10 118.66 41.34 150 80 150 C118.66 150 150 118.66 150 80 C150 41.34 118.66 10 80 10 Z"
              opacity="0.15"
            />
            <path
              d="M80 30 C52.38 30 30 52.38 30 80 C30 107.62 52.38 130 80 130 C107.62 130 130 107.62 130 80 C130 52.38 107.62 30 80 30 Z"
              opacity="0.4"
            />
            <path d="M80 45 C70 45 62 53 62 63 C62 70 66 76 72 79 C57 85 48 99 48 115 L112 115 C112 99 103 85 88 79 C94 76 98 70 98 63 C98 53 90 45 80 45 Z" />
            <circle cx="80" cy="63" fill="#13131a" r="14" />
          </svg>
        </div>

        <dl className="space-y-1 font-mono text-xs">
          <Row label="Born" value={authorBio.born} />
          {authorBio.died && <Row label="Died" value={authorBio.died} />}
          <Row label="Nationality" value={authorBio.nationality} />
          <Row label="Era" value={authorBio.era} />
          <div className="pt-2">
            <dt className="mb-1 text-zinc-500">Key Works</dt>
            <dd className="space-y-1 text-zinc-200">
              {authorBio.otherWorks.map((work) => (
                <span key={work} className="block">
                  • {work}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </div>

      <div className="space-y-5 font-serif text-lg leading-relaxed text-zinc-400 lg:col-span-8">
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-0.5 rounded px-2 py-2 odd:bg-zinc-900/60 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-zinc-500">{label}:</dt>
      <dd className="break-words text-zinc-200 sm:text-right">{value}</dd>
    </div>
  )
}

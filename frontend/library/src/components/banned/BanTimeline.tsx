import type { BanEvent } from '@/lib/bannedBooksData'

interface BanTimelineProps {
  events: BanEvent[]
}

export default function BanTimeline({ events }: BanTimelineProps) {
  return (
    <div className="relative max-w-4xl space-y-12 pl-8">
      <div className="absolute bottom-2 left-3 top-2 w-0.5 bg-red-800" />
      {events.map((event, i) => (
        <div key={`${event.year}-${event.entity}-${i}`} className="relative pl-6">
          <div className="absolute -left-[27px] top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-red-800 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#f8f7f3]" />
          </div>
          <div className="rounded bg-white p-6 shadow-sm md:p-8">
            <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-mono text-sm font-bold uppercase tracking-wider text-red-800">
                {event.year} · {event.country}
              </span>
              <span className="rounded bg-[#f5f4ef] px-2 py-0.5 font-mono text-xs text-zinc-600">
                {event.action.split('.')[0]?.slice(0, 48) ?? 'Suppression'}
              </span>
            </div>
            <h3 className="mb-2 break-words font-serif text-xl font-semibold text-zinc-900">{event.entity}</h3>
            <p className="mb-4 break-words font-serif text-base italic leading-relaxed text-zinc-700">
              Official judgment: &ldquo;{event.reasonGiven}&rdquo;
            </p>
            <div className="space-y-2 break-words text-sm leading-relaxed text-zinc-800">
              <p>
                <strong className="text-zinc-900">What happened:</strong> {event.action}
              </p>
              {event.outcome && (
                <p className="pt-1 font-mono text-xs text-red-900">Outcome: {event.outcome}</p>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

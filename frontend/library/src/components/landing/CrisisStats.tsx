'use client'

import { useEffect, useRef, useState } from 'react'

interface StatConfig {
  value: number
  suffix?: string
  label: string
  source: string
  dotColor: string
}

const STATS: StatConfig[] = [
  {
    value: 4235,
    label: 'Unique titles challenged in 2025 · USA',
    source: 'Source: ALA Office for Intellectual Freedom',
    dotColor: 'bg-[#c0392b]',
  },
  {
    value: 39,
    suffix: '%',
    label: 'Target LGBTQ+ voices or people of color',
    source: 'Source: ALA Office for Intellectual Freedom',
    dotColor: 'bg-[#9b59b6]',
  },
  {
    value: 202,
    label: 'Books removed in a single day · Alberta, Canada',
    source: 'Source: Freedom to Read Coalition / Ministerial Directive',
    dotColor: 'bg-[#ff9687]',
  },
  {
    value: 7884,
    label: 'Titles targeted by organized campaigns in 2025',
    source: 'Source: ALA Office for Intellectual Freedom',
    dotColor: 'bg-[#2ecc71]',
  },
]

function useCountUp(target: number, active: boolean, duration = 1800) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    if (!active) return

    let start: number | null = null
    let frame: number

    const step = (timestamp: number) => {
      if (start === null) start = timestamp
      const progress = Math.min((timestamp - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(target * eased))
      if (progress < 1) frame = requestAnimationFrame(step)
    }

    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])

  return display
}

function StatCard({ stat, active }: { stat: StatConfig; active: boolean }) {
  const count = useCountUp(stat.value, active)

  return (
    <div className="bg-[#1b1b22] p-8 rounded shadow-sm flex flex-col justify-between hover:bg-[#1f1f26] transition-colors">
      <div>
        <div className="font-['Share_Tech_Mono'] text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-white tracking-tight leading-none">
          {count.toLocaleString()}
          {stat.suffix ?? ''}
        </div>
        <div className="font-['Playfair_Display'] text-lg text-gray-200 tracking-wider mt-4 uppercase">
          {stat.label}
        </div>
      </div>
      <div className="font-['Share_Tech_Mono'] text-xs text-gray-500 mt-6 flex items-center gap-2">
        <span className={`w-1.5 h-1.5 rounded-full ${stat.dotColor}`} />
        {stat.source}
      </div>
    </div>
  )
}

export default function CrisisStats() {
  const sectionRef = useRef<HTMLElement>(null)
  const [active, setActive] = useState(false)

  useEffect(() => {
    const node = sectionRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setActive(true)
          observer.disconnect()
        }
      },
      { threshold: 0.25 }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <section ref={sectionRef} className="bg-[#0d0d14] py-24 px-8 relative">
      <div className="max-w-[1280px] mx-auto">
        <div className="text-center mb-16">
          <span className="font-['Share_Tech_Mono'] text-xs uppercase tracking-[0.3em] text-gray-400 block">
            RIGHT NOW
          </span>
          <h2 className="font-['Playfair_Display'] text-3xl md:text-[48px] text-white mt-3 font-bold">
            This is happening right now.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {STATS.map((stat) => (
            <StatCard key={stat.label} stat={stat} active={active} />
          ))}
        </div>

        <div className="mt-12 text-center">
          <span className="font-['Share_Tech_Mono'] mx-auto inline-flex max-w-full flex-wrap items-center justify-center gap-2 rounded bg-[#1f1f26] px-4 py-2 text-center text-xs text-[#4ae183] shadow-sm">
            <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
            [Live telemetry from Flow ledger: Preserving real-time challenges as immutable records]
          </span>
        </div>
      </div>
    </section>
  )
}

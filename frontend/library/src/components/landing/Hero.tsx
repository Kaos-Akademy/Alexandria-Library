'use client'

import Link from 'next/link'
import { ChevronDown, BookOpen } from 'lucide-react'

export default function Hero() {
  const scrollToMission = () => {
    document.getElementById('what-is-alexandria')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 py-20 overflow-hidden bg-[#0d0d14]">
      <div className="absolute inset-0 pointer-events-none opacity-[0.04] select-none font-['Share_Tech_Mono'] text-[11px] leading-relaxed tracking-widest text-gray-300 overflow-hidden p-6">
        <p className="whitespace-pre-wrap blur-[0.4px]">
          CLASSIFIED ARCHIVE // CITATION PROTOCOL 884-FLW // TOP SECRET // ALL PREVIOUS JURISDICTION
          CHALLENGES RECORDED ████████████████████ PROHIBITION ORDER REF 99042 // REMOVAL OF TEXT
          SUBMITTED UNDER STATUTE 14-B // REDACTED PERMANENCE OVERRIDE: FLOW BLOCKHEIGHT #71,204,912
          DEPOSITED INTO IPFS/ARWEAVE COMMONS WITHOUT REVOCATION PRIVILEGES
        </p>
        <p className="whitespace-pre-wrap blur-[0.4px] mt-6">
          RESTRICTED CIRCULATION UNDER COERCIVE COURT PROCEEDING 1882 // BOSTON DA VS. WHITMAN //
          INJUNCTION STRUCK DOWN ████████████████████ TITLES NUMBERING 4,235 STRICKEN FROM OPEN
          CIRCULATION IN SECONDARY SCHOOL REPOSITORIES
        </p>
      </div>

      <div className="absolute w-[560px] h-[560px] rounded-full bg-gradient-to-tr from-[#2ecc71]/10 via-[#9b59b6]/10 to-transparent blur-3xl pointer-events-none -top-24" />

      <div className="relative z-10 max-w-5xl mx-auto flex flex-col items-center">
        <span className="alexandria-title text-4xl sm:text-5xl md:text-8xl font-black tracking-wide sm:tracking-widest">
          ALEXANDRIA
        </span>

        <h1 className="font-['Playfair_Display'] text-3xl sm:text-4xl md:text-[56px] md:leading-[64px] text-white max-w-4xl mt-6 tracking-tight font-bold">
          The books they don&apos;t want you to read — preserved forever.
        </h1>

        <p className="font-['Share_Tech_Mono'] text-gray-400 text-sm md:text-base tracking-wider mt-4 max-w-2xl">
          4,235 books challenged in 2025. We put every single one beyond reach.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-5 mt-8">
          <Link
            href="/library"
            className="bg-gradient-to-r from-[#2ecc71] to-[#9b59b6] text-white text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded shadow-xl shadow-emerald-950/50 hover:brightness-110 transition-all duration-200 inline-flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Browse the Library
          </Link>
          <button
            type="button"
            onClick={scrollToMission}
            className="bg-[#1f1f26]/60 hover:bg-[#2a2931] text-white text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded shadow-md hover:text-[#2ecc71] transition-all duration-200 inline-flex items-center gap-2"
          >
            Read the Story
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      <button
        type="button"
        onClick={scrollToMission}
        className="absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-1 text-gray-400 animate-bounce cursor-pointer hover:text-[#2ecc71] transition-colors"
        style={{ bottom: 'calc(1.5rem + env(safe-area-inset-bottom, 0px))' }}
        aria-label="Scroll to learn more"
      >
        <span className="font-['Share_Tech_Mono'] uppercase tracking-widest text-[10px]">Scroll</span>
        <ChevronDown className="w-5 h-5 text-[#2ecc71]" />
      </button>
    </section>
  )
}

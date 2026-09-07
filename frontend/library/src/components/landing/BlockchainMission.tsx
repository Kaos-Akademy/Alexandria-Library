import Link from 'next/link'
import { Lock, Globe, ShieldCheck, BookOpen, HeartHandshake } from 'lucide-react'

const FEATURES = [
  {
    title: 'Immutable',
    description:
      'Every book stored on Flow is permanent. No library board can pull it from the chain.',
    icon: Lock,
    iconBg: 'bg-[#2ecc71]/10',
    iconColor: 'text-[#2ecc71]',
  },
  {
    title: 'Free',
    description:
      'Zero cost to read. Always. No account required to open any book in the global sanctuary.',
    icon: Globe,
    iconBg: 'bg-[#9b59b6]/10',
    iconColor: 'text-[#9b59b6]',
  },
  {
    title: 'Verifiable',
    description:
      'Every paragraph is publicly auditable on-chain. The source cannot be altered or redacted.',
    icon: ShieldCheck,
    iconBg: 'bg-[#4ae183]/10',
    iconColor: 'text-[#4ae183]',
  },
]

export default function BlockchainMission() {
  return (
    <section id="blockchain-architecture" className="bg-[#090910] py-24 px-8 text-center relative overflow-hidden">
      <div className="max-w-[720px] mx-auto relative z-10">
        <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white font-bold leading-tight">
          No government can delete a blockchain.
        </h2>
        <p className="font-['Share_Tech_Mono'] text-sm text-gray-400 uppercase tracking-widest mt-3 mb-12">
          THE ARCHITECTURE OF PERMANENCE
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left mb-12">
          {FEATURES.map(({ title, description, icon: Icon, iconBg, iconColor }) => (
            <div key={title} className="bg-[#1b1b22] p-6 rounded shadow-md">
              <div className={`w-10 h-10 rounded ${iconBg} ${iconColor} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="font-['Playfair_Display'] text-lg text-white font-bold">{title}</h3>
              <p className="text-sm text-gray-400 mt-2 leading-relaxed">{description}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center justify-center gap-5">
          <Link
            href="/library"
            className="bg-gradient-to-r from-[#2ecc71] to-[#9b59b6] text-white text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded shadow-xl shadow-emerald-950/40 hover:brightness-110 transition-all duration-200 inline-flex items-center gap-2"
          >
            <BookOpen className="w-5 h-5" />
            Start Reading
          </Link>
          <Link
            href="/contribute"
            className="bg-[#1f1f26]/60 hover:bg-[#2a2931] text-white text-xs font-semibold uppercase tracking-wider px-8 py-4 rounded shadow-md hover:text-[#2ecc71] transition-all duration-200 inline-flex items-center gap-2"
          >
            <HeartHandshake className="w-5 h-5" />
            Support the Library
          </Link>
        </div>

        <div className="mt-10 flex items-center justify-center gap-2 font-['Share_Tech_Mono'] text-xs text-gray-400">
          <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-pulse" />
          <span>Built on Flow · Cadence v1.0 · Censorship-Resistant Protocol</span>
        </div>
      </div>
    </section>
  )
}

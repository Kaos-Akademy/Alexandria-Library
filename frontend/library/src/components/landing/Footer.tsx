import Link from 'next/link'
import { Library } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="w-full bg-[#13131a]">
      <div className="max-w-[1280px] mx-auto px-4 md:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 pb-12">
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Library className="w-6 h-6 text-[#2ecc71]" />
              <span className="alexandria-title text-[22px] tracking-wider font-bold">
                ALEXANDRIA
              </span>
            </div>
            <p className="text-base text-gray-400 max-w-sm italic">
              Knowledge belongs to everyone, forever.
            </p>
            <div className="inline-flex max-w-full flex-wrap items-center gap-2 rounded bg-[#0d0d14] px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-[#2ecc71] animate-ping" />
              <span className="font-['Share_Tech_Mono'] text-[11px] uppercase text-[#2ecc71] tracking-wider">
                Built on Flow blockchain
              </span>
              <span className="font-['Share_Tech_Mono'] text-xs text-gray-500">• Mainnet Verifiable</span>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-white block">
              Archive Access
            </span>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/library" className="text-gray-400 hover:text-white transition-colors">
                  Universal Catalog
                </Link>
              </li>
              <li>
                <Link href="/banned-books" className="text-gray-400 hover:text-white transition-colors">
                  Censorship Chronicle
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Permanent Node Registry
                </Link>
              </li>
            </ul>
          </div>

          <div className="space-y-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-white block">
              Preservation &amp; Protocol
            </span>
            <ul className="space-y-1 text-sm">
              <li>
                <Link href="/contribute" className="text-gray-400 hover:text-white transition-colors">
                  Deposit Manuscript
                </Link>
              </li>
              <li>
                <Link href="/docs" className="text-gray-400 hover:text-white transition-colors">
                  Cadence Smart Contracts
                </Link>
              </li>
              <li>
                <Link href="/mission" className="text-gray-400 hover:text-white transition-colors">
                  Our Mission
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="font-['Share_Tech_Mono'] break-words text-center text-xs text-gray-500 sm:text-left">
            © {new Date().getFullYear()} Alexandria Protocol. Immutable Cultural Commons.
          </div>
          <div className="flex flex-wrap items-center gap-6 font-['Share_Tech_Mono'] text-xs text-gray-500">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">
              Privacy
            </Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">
              Terms
            </Link>
            <a
              href="https://x.com/AlexandriaLib_"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              X (Twitter)
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}

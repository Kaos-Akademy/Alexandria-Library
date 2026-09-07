import { Clock, Church, Users, AlertTriangle } from 'lucide-react'

const BLOCKS = [
  {
    title: 'POLITICAL POWER',
    quote:
      'When a government bans a book, it reveals its own fragility. The act of banning is a confession.',
    icon: Clock,
    color: 'text-[#2ecc71]',
  },
  {
    title: 'RELIGIOUS AUTHORITY',
    quote:
      "The Index Librorum Prohibitorum was the Catholic Church's admission of what it feared most.",
    icon: Church,
    color: 'text-[#9b59b6]',
  },
  {
    title: 'SOCIAL CONFORMITY',
    quote:
      'Books about queer lives were banned not because they were wrong, but because they were true.',
    icon: Users,
    color: 'text-[#4ae183]',
  },
  {
    title: 'SEXUAL LIBERATION',
    quote: 'To ban the body in literature is to deny the humanity of the reader.',
    icon: AlertTriangle,
    color: 'text-[#ff9687]',
  },
]

export default function WhyBooksAreBanned() {
  return (
    <section className="bg-[#1e1e30] py-24 px-8 relative">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 items-start mb-20">
          <div className="md:col-span-5 space-y-3">
            <span className="font-['Share_Tech_Mono'] text-xs text-[#4ae183] uppercase tracking-[0.25em] block">
              ANATOMY OF PROHIBITION
            </span>
            <h2 className="font-['Playfair_Display'] text-3xl md:text-[40px] text-white font-bold leading-tight">
              A book is banned when truth makes power uncomfortable.
            </h2>
            <div className="pt-6">
              <div className="w-16 h-1 bg-gradient-to-r from-[#2ecc71] to-[#9b59b6] rounded-full" />
            </div>
          </div>

          <div className="md:col-span-7 space-y-6">
            {BLOCKS.map(({ title, quote, icon: Icon, color }) => (
              <div
                key={title}
                className="bg-[#1b1b22] p-6 rounded flex items-start gap-5 shadow-sm"
              >
                <div className="w-10 h-10 rounded bg-[#1f1f26] flex items-center justify-center flex-shrink-0">
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-white block">
                    {title}
                  </span>
                  <p className="text-base italic text-gray-400 mt-1.5 leading-relaxed">
                    &ldquo;{quote}&rdquo;
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#0d0d14]/80 p-6 sm:p-10 md:p-14 rounded text-center relative max-w-4xl mx-auto shadow-xl">
          <div className="w-24 h-0.5 bg-[#2ecc71]/40 mx-auto mb-6" />
          <blockquote className="font-['Playfair_Display'] text-2xl md:text-4xl text-white italic leading-snug max-w-3xl mx-auto">
            &ldquo;Where they burn books, they will ultimately burn people also.&rdquo;
          </blockquote>
          <div className="font-['Share_Tech_Mono'] text-[#4ae183] text-sm tracking-wider uppercase mt-6">
            — Heinrich Heine, Almansor (1820)
          </div>
          <div className="w-24 h-0.5 bg-[#2ecc71]/40 mx-auto mt-6" />
        </div>
      </div>
    </section>
  )
}

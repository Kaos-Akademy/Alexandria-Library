interface EditorialSectionProps {
  label: string
  title: string
  body: string
  variant?: 'light' | 'dark' | 'accent'
  manifesto?: string
}

export default function EditorialSection({
  label,
  title,
  body,
  variant = 'light',
  manifesto,
}: EditorialSectionProps) {
  const paragraphs = body.split('\n\n').filter(Boolean)

  const styles = {
    light: {
      section: 'bg-[#f8f7f3] text-zinc-900',
      label: 'text-emerald-800',
      title: 'text-zinc-900',
      body: 'text-zinc-700',
      manifestoBg: 'bg-[#efece4]',
      manifestoText: 'text-zinc-900',
    },
    dark: {
      section: 'bg-zinc-800 text-zinc-100',
      label: 'text-zinc-500',
      title: 'text-white',
      body: 'text-zinc-300',
      manifestoBg: 'bg-zinc-950/60',
      manifestoText: 'text-white',
    },
    accent: {
      section: 'bg-zinc-900 text-zinc-100',
      label: 'text-zinc-500',
      title: 'text-white',
      body: 'text-zinc-200',
      manifestoBg: 'bg-zinc-950/60',
      manifestoText: 'text-white',
    },
  }[variant]

  return (
    <section className={`py-16 md:py-20 ${styles.section}`}>
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10 max-w-3xl">
          <span className={`mb-2 block font-mono text-[11px] uppercase tracking-widest ${styles.label}`}>
            {label}
          </span>
          <h2 className={`font-serif text-3xl font-semibold md:text-4xl ${styles.title}`}>{title}</h2>
        </div>

        <div className={`relative max-w-3xl space-y-5 pl-6 font-serif text-lg leading-relaxed ${styles.body}`}>
          {variant === 'accent' && (
            <div className="absolute bottom-1 left-0 top-1 w-1 rounded-full bg-emerald-500" />
          )}
          {paragraphs.map((p, i) => (
            <p key={i} className="break-words">{p}</p>
          ))}
        </div>

        {manifesto && (
          <div className={`mx-auto mt-12 max-w-4xl rounded py-10 text-center ${styles.manifestoBg}`}>
            <p className="mb-3 font-mono text-[11px] uppercase tracking-widest text-red-400">
              The root of the inquisition
            </p>
            <h3 className={`break-words font-serif text-3xl font-bold md:text-5xl ${styles.manifestoText}`}>
              {manifesto}
            </h3>
          </div>
        )}
      </div>
    </section>
  )
}

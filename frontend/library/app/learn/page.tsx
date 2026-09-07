import Link from 'next/link'
import {
  BookOpen,
  Bot,
  Brain,
  Headphones,
  Layers,
  Sparkles,
} from 'lucide-react'
import PlaceholderCard from '@/components/learn/PlaceholderCard'

const features = [
  {
    icon: Sparkles,
    title: 'Daily Book Bit',
    description:
      'Start each day with a curated passage from the library — a bite-sized moment of insight drawn from humanity\'s greatest works.',
  },
  {
    icon: Bot,
    title: 'AI Book Buddy',
    description:
      'Ask questions, explore themes, and dig deeper into any book with an AI companion that knows the full on-chain text.',
  },
  {
    icon: Layers,
    title: 'Flashcards',
    description:
      'Turn key quotes, characters, and concepts into spaced-repetition flashcards to remember what you read.',
  },
  {
    icon: Brain,
    title: 'Insights Stashes',
    description:
      'Save and organize your favorite passages, annotations, and takeaways into personal insight collections.',
  },
  {
    icon: BookOpen,
    title: 'Chapter Quizzes',
    description:
      'Test your comprehension after each chapter with quick quizzes that reinforce what you\'ve just read.',
  },
  {
    icon: Headphones,
    title: 'Listen Mode',
    description:
      'Follow along or listen hands-free with text-to-speech playback synced to the on-chain library.',
  },
] as const

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:py-12 md:py-16">
        <section className="text-center mb-12 sm:mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-emerald-600 mb-3">
            Coming soon
          </p>
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-gray-900 mb-4">
            Learn with Alexandria
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Interactive tools to read deeper, remember more, and connect with the books
            preserved forever on-chain. The learning layer is on its way.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 mb-12 sm:mb-16">
          {features.map((feature) => (
            <PlaceholderCard
              key={feature.title}
              icon={feature.icon}
              title={feature.title}
              description={feature.description}
            />
          ))}
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gradient-to-br from-emerald-50/80 to-purple-50/50 p-8 sm:p-10 text-center">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3">
            Help build the learning layer
          </h2>
          <p className="text-sm sm:text-base text-gray-600 max-w-xl mx-auto mb-6">
            Connect your wallet and contribute to keep the library alive. Early supporters
            help fund the tools that make on-chain books truly interactive.
          </p>
          <Link
            href="/contribute"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full px-6 py-3 text-sm font-semibold
                       bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 text-black
                       shadow-md shadow-emerald-500/30 hover:shadow-lg hover:shadow-emerald-500/40
                       hover:from-emerald-300 hover:via-cyan-300 hover:to-purple-300
                       transition-all duration-200"
          >
            Connect wallet &amp; contribute
          </Link>
        </section>
      </div>
    </div>
  )
}

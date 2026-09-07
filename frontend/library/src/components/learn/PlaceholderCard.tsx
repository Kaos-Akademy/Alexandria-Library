import type { LucideIcon } from 'lucide-react'

type Props = {
  icon: LucideIcon
  title: string
  description: string
}

export default function PlaceholderCard({ icon: Icon, title, description }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 sm:p-6 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
      <div className="mb-3 inline-flex items-center justify-center rounded-lg bg-emerald-50 p-2.5 text-emerald-600">
        <Icon className="h-5 w-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
      <span className="mt-3 inline-block text-xs font-medium uppercase tracking-wide text-gray-400">
        Coming soon
      </span>
    </div>
  )
}

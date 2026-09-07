type StampVariant = 'banned' | 'burned'

interface BannedStampProps {
  variant?: StampVariant
  className?: string
}

export default function BannedStamp({ variant = 'banned', className = '' }: BannedStampProps) {
  const label = variant === 'burned' ? 'BURNED' : 'BANNED'

  return (
    <span
      className={`absolute top-3 right-3 -rotate-6 bg-[#c0392b] text-white font-['Share_Tech_Mono'] font-bold text-[10px] tracking-widest px-2 py-1 uppercase rounded ${className}`}
    >
      {label}
    </span>
  )
}

export function stampVariantFromAction(action: string): StampVariant {
  return action.toLowerCase().includes('burn') ? 'burned' : 'banned'
}

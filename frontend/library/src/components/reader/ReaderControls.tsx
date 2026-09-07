import { useEffect, useRef } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import type { ReaderSettings, ReaderFontFamily, ReaderTheme, ReaderMode } from './types'
import { useMediaQuery } from '@/lib/useMediaQuery'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  settings: ReaderSettings
  onChange: (next: Partial<ReaderSettings>) => void
  autoHideMs?: number
}

function OptionGroup<T extends string>({
  label,
  options,
  value,
  onSelect,
  format = (v) => v,
}: {
  label: string
  options: readonly T[]
  value: T
  onSelect: (v: T) => void
  format?: (v: T) => string
}) {
  return (
    <fieldset>
      <label className="font-medium">{label}</label>
      <div className="mt-2 flex flex-wrap gap-1 rounded-md border p-1">
        {options.map((v) => (
          <button
            key={v}
            type="button"
            className={`min-h-[44px] flex-1 rounded px-3 py-2 text-sm sm:flex-none ${
              value === v ? 'bg-gray-100 font-medium' : 'hover:bg-gray-50'
            }`}
            aria-pressed={value === v}
            onClick={() => onSelect(v)}
          >
            {format(v)}
          </button>
        ))}
      </div>
    </fieldset>
  )
}

export default function ReaderControls({ open, onOpenChange, settings, onChange, autoHideMs = 4000 }: Props) {
  const timerRef = useRef<number | null>(null)
  const isCoarsePointer = useMediaQuery('(pointer: coarse)')

  useEffect(() => {
    if (!open || isCoarsePointer) return
    const kick = () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
      timerRef.current = window.setTimeout(() => onOpenChange(false), autoHideMs)
    }
    kick()
    const onMove = () => kick()
    document.addEventListener('pointermove', onMove, { passive: true })
    document.addEventListener('keydown', onMove)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('keydown', onMove)
      if (timerRef.current) window.clearTimeout(timerRef.current)
    }
  }, [open, autoHideMs, onOpenChange, isCoarsePointer])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85dvh] overflow-y-auto p-4 sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reading settings</DialogTitle>
        </DialogHeader>
        <div className="grid gap-3 text-sm">
          <OptionGroup
            label="Font size"
            options={['sm', 'md', 'lg'] as const}
            value={settings.fontSize}
            onSelect={(v) => onChange({ fontSize: v })}
            format={(v) => v.toUpperCase()}
          />
          <OptionGroup
            label="Line spacing"
            options={['compact', 'normal', 'relaxed'] as const}
            value={settings.lineSpacing}
            onSelect={(v) => onChange({ lineSpacing: v })}
          />
          <OptionGroup
            label="Font family"
            options={['serif', 'sans'] as ReaderFontFamily[]}
            value={settings.fontFamily}
            onSelect={(v) => onChange({ fontFamily: v })}
          />
          <OptionGroup
            label="Theme"
            options={['day', 'night', 'sepia'] as ReaderTheme[]}
            value={settings.theme}
            onSelect={(v) => onChange({ theme: v })}
          />
          <OptionGroup
            label="Width"
            options={['narrow', 'normal', 'wide'] as const}
            value={settings.width}
            onSelect={(v) => onChange({ width: v })}
          />
          <fieldset>
            <label className="font-medium">Brightness (dimming)</label>
            <input
              type="range"
              aria-label="Brightness dimming"
              min={0}
              max={80}
              value={settings.brightness}
              onChange={(e) => onChange({ brightness: Number(e.target.value) })}
              className="mt-2 min-h-[44px] w-full"
            />
          </fieldset>
          <OptionGroup
            label="Mode"
            options={['scroll', 'page'] as ReaderMode[]}
            value={settings.mode}
            onSelect={(v) => onChange({ mode: v })}
          />
        </div>
      </DialogContent>
    </Dialog>
  )
}

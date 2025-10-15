import { useEffect, useRef } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { ReaderSettings, ReaderFontFamily, ReaderTheme, ReaderMode } from './types'

type Props = {
  open: boolean
  onOpenChange: (o: boolean) => void
  settings: ReaderSettings
  onChange: (next: Partial<ReaderSettings>) => void
  autoHideMs?: number
}

export default function ReaderControls({ open, onOpenChange, settings, onChange, autoHideMs = 4000 }: Props) {
  const timerRef = useRef<number | null>(null)
  useEffect(() => {
    if (!open) return
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
  }, [open, autoHideMs, onOpenChange])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-4 sm:max-w-md">
        <div className="grid gap-3 text-sm">
          <fieldset>
            <label className="font-medium">Font size</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['sm','md','lg'] as const).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.fontSize === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  aria-pressed={settings.fontSize === v}
                  onClick={() => onChange({ fontSize: v })}
                >{v.toUpperCase()}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="font-medium">Line spacing</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['compact','normal','relaxed'] as const).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.lineSpacing === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onChange({ lineSpacing: v })}
                >{v}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="font-medium">Font family</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['serif','sans'] as ReaderFontFamily[]).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.fontFamily === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onChange({ fontFamily: v })}
                >{v}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="font-medium">Theme</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['day','night','sepia'] as ReaderTheme[]).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.theme === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onChange({ theme: v })}
                >{v}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="font-medium">Width</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['narrow','normal','wide'] as const).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.width === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onChange({ width: v })}
                >{v}</button>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <label className="font-medium">Brightness (dimming)</label>
            <input
              type="range"
              aria-label="Brightness dimming"
              min={0} max={80} value={settings.brightness}
              onChange={(e) => onChange({ brightness: Number(e.target.value) })}
              className="w-full"
            />
          </fieldset>

          <fieldset>
            <label className="font-medium">Mode</label>
            <div className="mt-2 inline-flex rounded-md border overflow-hidden">
              {(['scroll','page'] as ReaderMode[]).map(v => (
                <button
                  key={v}
                  className={`px-3 py-1.5 ${settings.mode === v ? 'bg-gray-100' : 'hover:bg-gray-50'}`}
                  onClick={() => onChange({ mode: v })}
                >{v}</button>
              ))}
            </div>
          </fieldset>
        </div>
      </DialogContent>
    </Dialog>
  )
}



import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReaderControls from './ReaderControls'
import { useReaderSettings } from './useReaderSettings'
import { paginateParagraphs } from './paginate'
import type { ReaderMode } from './types'
import './styles.css'

type Props = {
  content: string
  initialOpenControls?: boolean
  onProgressChange?: (p: number) => void
  ariaLabel?: string
}

export default function Reader({ content, initialOpenControls, onProgressChange, ariaLabel = 'Reading view' }: Props) {
  const { settings, setSettings } = useReaderSettings()
  const [controlsOpen, setControlsOpen] = useState(!!initialOpenControls)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const pageRef = useRef<HTMLDivElement | null>(null)

  const paragraphs = useMemo(() => {
    if (/<(p|div|h\d|ul|ol|li|br)[\s>]/i.test(content)) {
      return [content]
    }
    return content
      .split(/\n{2,}/g)
      .map((p) => `<p>${escapeHtml(p).replaceAll('\n', '<br/>')}</p>`)
  }, [content])

  const [pages, setPages] = useState<string[] | null>(null)
  const [pageIdx, setPageIdx] = useState(0)

  const recomputePages = useCallback(() => {
    if (settings.mode !== 'page') return
    const measure = (html: string) => {
      if (!pageRef.current) return 0
      pageRef.current.innerHTML = html
      return pageRef.current.scrollHeight
    }
    const pageHeight = containerRef.current ? containerRef.current.clientHeight : 0
    const next = paginateParagraphs(paragraphs, measure, Math.max(0, pageHeight - 8))
    setPages(next)
    setPageIdx(0)
  }, [paragraphs, settings.mode])

  useEffect(() => {
    if (settings.mode === 'page') {
      recomputePages()
    } else {
      setPages(null)
    }
  }, [settings.mode, settings.fontSize, settings.lineSpacing, settings.width, settings.fontFamily, recomputePages])

  useEffect(() => {
    if (!containerRef.current || settings.mode !== 'scroll') return
    const el = containerRef.current
    const onScroll = () => {
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? el.scrollTop / max : 0
      onProgressChange?.(p)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    onScroll()
    return () => el.removeEventListener('scroll', onScroll)
  }, [settings.mode, onProgressChange])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (settings.mode !== 'page') return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') setPageIdx((i) => Math.min((pages?.length ?? 1) - 1, i + 1))
      if (e.key === 'ArrowLeft' || e.key === 'PageUp') setPageIdx((i) => Math.max(0, i - 1))
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [settings.mode, pages])

  const progress = useMemo(() => {
    if (settings.mode === 'page') {
      const total = pages?.length ?? 1
      return total > 1 ? pageIdx / (total - 1) : 0
    }
    if (!containerRef.current) return 0
    const el = containerRef.current
    const max = el.scrollHeight - el.clientHeight
    return max > 0 ? el.scrollTop / max : 0
  }, [settings.mode, pageIdx, pages])

  const jumpToProgress = (value0to1: number) => {
    if (settings.mode === 'page' && pages) {
      const idx = Math.round(value0to1 * (pages.length - 1))
      setPageIdx(Math.min(Math.max(idx, 0), pages.length - 1))
      return
    }
    const el = containerRef.current
    if (!el) return
    const max = el.scrollHeight - el.clientHeight
    el.scrollTop = max * value0to1
  }

  const cssVars: React.CSSProperties = {
    ["--reader-font-size" as any]: settings.fontSize === 'sm' ? '15px' : settings.fontSize === 'lg' ? '18px' : '16px',
    ["--reader-line-height" as any]: settings.lineSpacing === 'compact' ? '1.5' : settings.lineSpacing === 'relaxed' ? '1.85' : '1.7',
    ["--reader-font-family" as any]: settings.fontFamily === 'serif' ? "ui-serif, Georgia, 'Source Serif Pro', serif" : "ui-sans-serif, Inter, system-ui, sans-serif",
    ["--reader-max-width" as any]: settings.width === 'narrow' ? '42ch' : settings.width === 'wide' ? '70ch' : '60ch',
    ["--reader-bg" as any]: settings.theme === 'day' ? 'oklch(1 0 0)' : settings.theme === 'sepia' ? 'oklch(0.96 0.02 80)' : 'oklch(0.16 0.02 260)',
    ["--reader-fg" as any]: settings.theme === 'night' ? 'oklch(0.98 0 0)' : 'oklch(0.22 0.01 260)',
    ["--reader-dim" as any]: `${Math.min(80, Math.max(0, settings.brightness)) / 100}`,
    ["--safe-top" as any]: 'env(safe-area-inset-top, 0px)',
    ["--safe-bottom" as any]: 'env(safe-area-inset-bottom, 0px)',
  }

  const onTap = () => setControlsOpen((o) => !o)

  // Progressive rendering in scroll mode: chunk paragraphs to avoid long initial paint
  const [renderCount, setRenderCount] = useState(20)
  useEffect(() => {
    if (settings.mode !== 'scroll') return
    if (renderCount >= paragraphs.length) return
    const id = window.setTimeout(() => setRenderCount((c) => Math.min(c + 40, paragraphs.length)), 50)
    return () => window.clearTimeout(id)
  }, [renderCount, paragraphs.length, settings.mode])

  return (
    <div className="reader-root" style={cssVars}>
      <div className="reader-content-wrap">
        <div
          ref={containerRef}
          className={`reader-content ${settings.mode === 'page' ? 'reader-content--page' : 'reader-content--scroll'}`}
          aria-label={ariaLabel}
          onClick={onTap}
        >
          <div className="reader-dim" aria-hidden />
          <div ref={pageRef} className="reader-probe" aria-hidden />
          {settings.mode === 'page' ? (
            <div className="reader-page" dangerouslySetInnerHTML={{ __html: pages?.[pageIdx] ?? '' }} />
          ) : (
            <article className="reader-article" dangerouslySetInnerHTML={{ __html: paragraphs.slice(0, renderCount).join('') }} />
          )}
        </div>

        <div className="reader-progress">
          <input
            type="range"
            min={0}
            max={1000}
            value={Math.round(progress * 1000)}
            onChange={(e) => jumpToProgress(Number(e.target.value) / 1000)}
            aria-label="Reading progress"
            className="w-full"
          />
          <div className="reader-progress-label">{Math.round(progress * 100)}%</div>
        </div>
      </div>

      <button type="button" className="reader-fab" aria-label="Reading settings" onClick={() => setControlsOpen(true)}>
        Aa
      </button>

      <ReaderControls
        open={controlsOpen}
        onOpenChange={setControlsOpen}
        settings={settings}
        onChange={(next) => setSettings({ ...settings, ...next })}
      />
    </div>
  )
}

function escapeHtml(s: string) {
  return s.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
}



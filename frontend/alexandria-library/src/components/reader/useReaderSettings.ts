import { useEffect, useState } from 'react'
import type { ReaderSettings } from './types'

const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 'md',
  lineSpacing: 'normal',
  fontFamily: 'serif',
  theme: 'day',
  width: 'normal',
  brightness: 0,
  mode: 'scroll',
}

const STORAGE_KEY = 'reader:settings.v1'

export function useReaderSettings() {
  const [settings, setSettings] = useState<ReaderSettings>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS
    } catch {
      return DEFAULT_SETTINGS
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {}
  }, [settings])

  return { settings, setSettings, DEFAULT_SETTINGS }
}



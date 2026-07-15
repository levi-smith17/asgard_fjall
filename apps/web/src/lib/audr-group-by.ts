import type { AudrCanvasGroupBy } from '@/lib/audr-format'

const STORAGE_KEY = 'asgard.audr.canvasGroupBy'

export function loadAudrCanvasGroupBy(): AudrCanvasGroupBy {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'sjodr' || raw === 'run') return raw
  } catch {
    // ignore
  }
  return 'run'
}

export function saveAudrCanvasGroupBy(value: AudrCanvasGroupBy): void {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
}

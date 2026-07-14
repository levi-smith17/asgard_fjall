import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'

export type ColorPalette = 'green' | 'fjall'

const STORAGE_KEY = 'fjall:palette'

const PALETTE_ORDER: ColorPalette[] = ['green', 'fjall']

const PALETTE_LABELS: Record<ColorPalette, string> = {
  green: 'Green',
  fjall: 'Gold',
}

const FAVICON_BY_PALETTE: Record<ColorPalette, string> = {
  green: '/favicon.svg',
  fjall: '/favicon-fjall.svg',
}

function readStoredPalette(): ColorPalette {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'green' || stored === 'fjall') return stored
  } catch {
    // ignore
  }
  return 'green'
}

function applyFavicon(palette: ColorPalette) {
  const href = FAVICON_BY_PALETTE[palette]
  let link = document.querySelector<HTMLLinkElement>('link[rel="icon"][type="image/svg+xml"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    link.type = 'image/svg+xml'
    document.head.appendChild(link)
  }
  if (link.getAttribute('href') !== href) {
    link.setAttribute('href', href)
  }
}

function applyPalette(palette: ColorPalette) {
  document.documentElement.dataset.palette = palette
  applyFavicon(palette)
}

/** Apply stored palette favicon before React mounts to avoid a flash of the default green icon. */
export function bootstrapPaletteFromStorage() {
  const palette = readStoredPalette()
  applyPalette(palette)
}

type PaletteContextValue = {
  palette: ColorPalette
  setPalette: (palette: ColorPalette) => void
  cyclePalette: () => void
  paletteLabel: string
  nextPaletteLabel: string
  toggleTooltip: string
}

const PaletteContext = createContext<PaletteContextValue | null>(null)

export function PaletteProvider({ children }: { children: ReactNode }) {
  const [palette, setPaletteState] = useState<ColorPalette>(() => {
    const initial = readStoredPalette()
    applyPalette(initial)
    return initial
  })

  const setPalette = useCallback((next: ColorPalette) => {
    setPaletteState(next)
    applyPalette(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // ignore
    }
  }, [])

  const cyclePalette = useCallback(() => {
    const idx = PALETTE_ORDER.indexOf(palette)
    const next = PALETTE_ORDER[(idx + 1) % PALETTE_ORDER.length]
    setPalette(next)
  }, [palette, setPalette])

  useEffect(() => {
    applyPalette(palette)
  }, [palette])

  const nextPalette = PALETTE_ORDER[(PALETTE_ORDER.indexOf(palette) + 1) % PALETTE_ORDER.length]

  const value = useMemo(
    () => ({
      palette,
      setPalette,
      cyclePalette,
      paletteLabel: PALETTE_LABELS[palette],
      nextPaletteLabel: PALETTE_LABELS[nextPalette],
      toggleTooltip: PALETTE_LABELS[nextPalette],
    }),
    [palette, setPalette, cyclePalette, nextPalette],
  )

  return <PaletteContext.Provider value={value}>{children}</PaletteContext.Provider>
}

export function usePalette() {
  const ctx = useContext(PaletteContext)
  if (!ctx) throw new Error('usePalette must be used within PaletteProvider')
  return ctx
}

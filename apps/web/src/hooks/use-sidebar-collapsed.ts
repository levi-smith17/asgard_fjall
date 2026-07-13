import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'fjall:sidebar-collapsed'

export function readSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeSidebarCollapsed(collapsed: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, collapsed ? '1' : '0')
  } catch {
    /* ignore */
  }
}

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia(query).matches : false,
  )

  useEffect(() => {
    const media = window.matchMedia(query)
    const onChange = () => setMatches(media.matches)
    onChange()
    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [query])

  return matches
}

export function useSidebarCollapsed() {
  const isDesktop = useMediaQuery('(min-width: 1024px)')
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => readSidebarCollapsed())

  const isNarrow = !isDesktop || desktopCollapsed

  const toggleDesktopCollapsed = useCallback(() => {
    setDesktopCollapsed((current) => {
      const next = !current
      writeSidebarCollapsed(next)
      return next
    })
  }, [])

  return {
    isDesktop,
    isNarrow,
    desktopCollapsed,
    toggleDesktopCollapsed,
  }
}

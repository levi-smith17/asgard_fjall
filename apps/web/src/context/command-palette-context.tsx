import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type CommandPaletteContextValue = {
  open: boolean
  openCommandPalette: () => void
  closeCommandPalette: () => void
  toggleCommandPalette: () => void
}

const CommandPaletteContext = createContext<CommandPaletteContextValue | null>(null)

export function CommandPaletteProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)

  const openCommandPalette = useCallback(() => setOpen(true), [])
  const closeCommandPalette = useCallback(() => setOpen(false), [])
  const toggleCommandPalette = useCallback(() => setOpen((prev) => !prev), [])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.key.toLowerCase() !== 'k') return
      e.preventDefault()
      setOpen((prev) => !prev)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const value = useMemo(
    () => ({
      open,
      openCommandPalette,
      closeCommandPalette,
      toggleCommandPalette,
    }),
    [open, openCommandPalette, closeCommandPalette, toggleCommandPalette],
  )

  return (
    <CommandPaletteContext.Provider value={value}>{children}</CommandPaletteContext.Provider>
  )
}

export function useCommandPalette() {
  const ctx = useContext(CommandPaletteContext)
  if (!ctx) {
    throw new Error('useCommandPalette must be used within CommandPaletteProvider')
  }
  return ctx
}

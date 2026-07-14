import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { BookType, MoreHorizontal, Moon, Palette, Settings, Sun } from 'lucide-react'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { usePalette } from '@/hooks/use-palette'
import { useTerminology } from '@/hooks/use-terminology'
import { useTheme } from '@/hooks/use-theme'
import { cn } from '@/lib/utils'

function themeToggleLabel(style: string, theme: string): string {
  if (style === 'ASGARD') return theme === 'dark' ? 'Ljos' : 'Mrykr'
  return theme === 'dark' ? 'Light' : 'Dark'
}

/** Collapses footer utilities into a single flyout on the narrow sidebar. */
export function SidebarUtilitiesFlyout() {
  const { pathname } = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { style, terms, cycleTerminology, toggleTooltip } = useTerminology()
  const { cyclePalette, toggleTooltip: paletteTooltip } = usePalette()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const settingsActive = pathname.startsWith('/thing')

  const themeLabel = themeToggleLabel(style, theme)

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const menuHeight = 176
      const top = Math.min(rectBottomSafe(el, menuHeight), window.innerHeight - menuHeight - 8)
      setMenuPos({ top: Math.max(8, top), left: el.getBoundingClientRect().right + 8 })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen((current) => !current)}
      className={cn(
        'relative flex h-8 w-8 items-center justify-center rounded-md transition-colors',
        open
          ? 'bg-sidebar-accent text-sidebar-foreground-active'
          : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
      )}
      aria-label="Utilities"
      aria-expanded={open}
      aria-haspopup="menu"
    >
      <MoreHorizontal className="h-4 w-4" aria-hidden />
    </button>
  )

  const itemClass =
    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted-hover'

  return (
    <>
      {open ? (
        trigger
      ) : (
        <ToolbarTooltip label="Utilities" placement="right">
          {trigger}
        </ToolbarTooltip>
      )}

      {open && menuPos
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                aria-label="Close utilities menu"
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                className="fixed z-50 w-52 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    cycleTerminology()
                  }}
                >
                  <BookType className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{toggleTooltip}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    cyclePalette()
                  }}
                >
                  <Palette className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{paletteTooltip}</span>
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className={itemClass}
                  onClick={() => {
                    toggleTheme()
                  }}
                >
                  {theme === 'dark' ? (
                    <Sun className="h-4 w-4 shrink-0" aria-hidden />
                  ) : (
                    <Moon className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span className="truncate">{themeLabel}</span>
                </button>
                <Link
                  to="/thing"
                  role="menuitem"
                  className={cn(itemClass, settingsActive && 'bg-primary/10 text-primary')}
                  onClick={() => setOpen(false)}
                >
                  <Settings className="h-4 w-4 shrink-0" aria-hidden />
                  <span className="truncate">{terms.settings}</span>
                </Link>
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}

function rectBottomSafe(el: HTMLElement, menuHeight: number) {
  return el.getBoundingClientRect().bottom - menuHeight
}

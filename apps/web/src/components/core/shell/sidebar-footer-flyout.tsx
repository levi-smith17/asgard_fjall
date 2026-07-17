import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

export type SidebarFooterFlyoutItem = {
  key: string
  label: string
  icon: ReactNode
  onSelect?: () => void
  to?: string
  active?: boolean
  badge?: ReactNode
}

/** Collapses the sidebar footer controls into a single flyout when the rail is narrow. */
export function SidebarFooterFlyout({
  trigger,
  triggerLabel,
  items,
  footer,
}: {
  trigger: ReactNode
  triggerLabel: string
  items: SidebarFooterFlyoutItem[]
  footer?: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const estimatedHeight = Math.min(items.length * 40 + (footer ? 64 : 16), window.innerHeight - 16)
      const preferredTop = rect.bottom - estimatedHeight
      const top = Math.max(8, Math.min(preferredTop, window.innerHeight - estimatedHeight - 8))
      setMenuPos({ top, left: rect.right + 8 })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, items.length, footer])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointer = (e: MouseEvent) => {
      const target = e.target as Node
      if (triggerRef.current?.contains(target)) return
      const menu = document.getElementById('sidebar-footer-flyout-menu')
      if (menu?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onPointer)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onPointer)
    }
  }, [open])

  return (
    <>
      <ToolbarTooltip label={triggerLabel} placement="right" className="w-full">
        <button
          ref={triggerRef}
          type="button"
          onClick={() => setOpen((current) => !current)}
          className={cn(
            'relative flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-sm font-medium transition-colors',
            open
              ? 'bg-sidebar-accent text-sidebar-foreground-active'
              : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
          )}
          aria-label={triggerLabel}
          aria-expanded={open}
          aria-haspopup="menu"
        >
          {trigger}
        </button>
      </ToolbarTooltip>
      {open && menuPos
        ? createPortal(
            <div
              id="sidebar-footer-flyout-menu"
              role="menu"
              className="fixed z-[200] min-w-[12.5rem] overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {items.map((item) => {
                const className = cn(
                  'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors',
                  item.active
                    ? 'bg-primary/10 text-primary'
                    : 'text-foreground hover:bg-muted-hover',
                )
                if (item.to) {
                  return (
                    <Link
                      key={item.key}
                      to={item.to}
                      role="menuitem"
                      className={className}
                      onClick={() => setOpen(false)}
                    >
                      <span className="relative shrink-0">{item.icon}</span>
                      <span className="min-w-0 flex-1 truncate">{item.label}</span>
                      {item.badge}
                    </Link>
                  )
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    className={className}
                    onClick={() => {
                      item.onSelect?.()
                      setOpen(false)
                    }}
                  >
                    <span className="relative shrink-0">{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge}
                  </button>
                )
              })}
              {footer ? (
                <div className="mt-1 border-t border-border px-3 py-2">{footer}</div>
              ) : null}
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

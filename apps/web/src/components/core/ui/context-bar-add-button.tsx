import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

export function ContextBarAddButton({
  label,
  shortLabel,
  onClick,
}: {
  label: string
  shortLabel?: string
  onClick: () => void
}) {
  const visibleLabel = shortLabel ?? label

  return (
    <ToolbarTooltip label={label}>
      <Button type="button" onClick={onClick} className="h-9 gap-1.5 px-2.5 shadow-sm sm:px-4">
        <Plus className="h-4 w-4 shrink-0" aria-hidden />
        <span className="hidden sm:inline">{visibleLabel}</span>
      </Button>
    </ToolbarTooltip>
  )
}

export type ContextBarSplitAddItem = {
  id: string
  label: string
  onSelect: () => void
  icon?: React.ComponentType<{ className?: string }>
}

/** Primary green add action with a chevron menu for secondary create actions. */
export function ContextBarSplitAddButton({
  label,
  shortLabel,
  onClick,
  menuLabel = 'More create options',
  items,
}: {
  label: string
  shortLabel?: string
  onClick: () => void
  menuLabel?: string
  items: ContextBarSplitAddItem[]
}) {
  const visibleLabel = shortLabel ?? label
  const [open, setOpen] = useState(false)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    const update = () => {
      const el = rootRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const menuWidth = menuRef.current?.offsetWidth ?? 176
      const left = Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - 8)
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left) })
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
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex shrink-0 shadow-sm">
      <ToolbarTooltip label={label}>
        <Button
          type="button"
          onClick={onClick}
          className="h-9 gap-1.5 rounded-r-none px-2.5 sm:px-4"
        >
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{visibleLabel}</span>
        </Button>
      </ToolbarTooltip>
      <Button
        type="button"
        className={cn(
          'h-9 rounded-l-none border-l border-primary-foreground/25 px-2',
          open && 'bg-primary/90',
        )}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={menuLabel}
        onClick={() => setOpen((current) => !current)}
      >
        <ChevronDown className="h-4 w-4" aria-hidden />
      </Button>
      {open && menuPos
        ? createPortal(
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              className="fixed z-[200] min-w-[11rem] overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg"
              style={{ top: menuPos.top, left: menuPos.left }}
            >
              {items.map((item) => {
                const Icon = item.icon
                return (
                  <button
                    key={item.id}
                    type="button"
                    role="menuitem"
                    className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
                    onClick={() => {
                      item.onSelect()
                      setOpen(false)
                    }}
                  >
                    {Icon ? (
                      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    ) : null}
                    <span className="truncate">{item.label}</span>
                  </button>
                )
              })}
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

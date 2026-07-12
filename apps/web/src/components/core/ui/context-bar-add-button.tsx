import { useEffect, useId, useRef, useState } from 'react'
import { ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

export function ContextBarAddButton({ label, shortLabel, onClick }: { label: string; shortLabel?: string; onClick: () => void }) {
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

export type ContextBarSplitAddItem = { id: string; label: string; onSelect: () => void }

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
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey) }
  }, [open])

  return (
    <div ref={rootRef} className="relative flex shrink-0 shadow-sm">
      <ToolbarTooltip label={label}>
        <Button type="button" onClick={onClick} className="h-9 gap-1.5 rounded-r-none px-2.5 sm:px-4">
          <Plus className="h-4 w-4 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{visibleLabel}</span>
        </Button>
      </ToolbarTooltip>
      <ToolbarTooltip label={menuLabel}>
        <Button type="button" className={cn('h-9 rounded-l-none border-l border-primary-foreground/25 px-2', open && 'bg-primary/90')} aria-haspopup="menu" aria-expanded={open} aria-controls={menuId} aria-label={menuLabel} onClick={() => setOpen((c) => !c)}>
          <ChevronDown className="h-4 w-4" aria-hidden />
        </Button>
      </ToolbarTooltip>
      {open ? (
        <div id={menuId} role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-[11rem] overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg">
          {items.map((item) => (
            <button key={item.id} type="button" role="menuitem" className="flex w-full items-center px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted/60" onClick={() => { item.onSelect(); setOpen(false) }}>
              {item.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

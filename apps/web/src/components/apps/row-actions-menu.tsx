import { useEffect, useRef, useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { cn } from '@/lib/utils'

export type RowAction = { id: string; label: string; icon?: React.ReactNode; destructive?: boolean; onSelect: () => void }

export function RowActionsMenu({ actions }: { actions: RowAction[] }) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => { if (!rootRef.current?.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  return (
    <div ref={rootRef} className="relative shrink-0">
      <Button type="button" variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}>
        <MoreHorizontal className="h-4 w-4" />
      </Button>
      {open ? (
        <div role="menu" className="absolute right-0 top-full z-50 mt-1 min-w-[9rem] overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg">
          {actions.map((action) => (
            <button key={action.id} type="button" role="menuitem" className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-muted-hover', action.destructive ? 'text-destructive' : 'text-foreground')} onClick={() => { setOpen(false); action.onSelect() }}>
              {action.icon}
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}

import { useState } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { deleteCairnCache } from '@/lib/data-api'
import { InlineCacheForm } from './inline-cache-form'
import type { CairnCacheUtilization } from '@/lib/data-types'
import { useTerms } from '@/hooks/use-terminology'

interface Props {
  cache: CairnCacheUtilization
  markers: { id: string; name: string; color: string; icon?: string | null }[]
  month: number
  year: number
  onSaved: () => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const utilizationColor = (pct: number) => {
  if (pct >= 100) return 'bg-destructive'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

function cacheMarkerLabel(cache: CairnCacheUtilization, markers: Props['markers']): string {
  const name = markers.find((m) => m.id === cache.markerId)?.name ?? cache.marker?.name
  if (!name || name === 'Uncategorized') return 'Uncategorized'
  return name.split('/').pop() ?? name
}

export function CacheRow({ cache, markers, month, year, onSaved, onDeleted }: Props) {
  const terms = useTerms()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const markerLabel = cacheMarkerLabel(cache, markers)

  if (editing) {
    return (
      <InlineCacheForm
        cache={cache}
        markers={markers}
        month={month}
        year={year}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="group px-3 py-2.5 hover:bg-muted/30">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{markerLabel}</span>
          <div className="flex items-center gap-1">
            <span className="text-xs tabular-nums text-muted-foreground">
              {fmt(cache.spent)} / {fmt(cache.limit)}
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setEditing(true)} title={`Edit ${terms.budgetSingular}`}>
              <Pencil className="h-3 w-3" />
            </Button>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setConfirmDelete(true)} title={`Remove ${terms.budgetSingular}`}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={`h-full rounded-full transition-all ${utilizationColor(cache.utilization)}`}
            style={{ width: `${Math.min(cache.utilization, 100)}%` }}
          />
        </div>
        <div className="mt-1 flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(cache.utilization)}% used</span>
          <span>{fmt(Math.max(cache.limit - cache.spent, 0))} left</span>
        </div>
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`Remove ${terms.budgetSingular.toLowerCase()}?`}
        description={<>This will remove the &ldquo;{markerLabel}&rdquo; {terms.budgetSingular.toLowerCase()} limit for this month.</>}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { await deleteCairnCache(cache.id); setConfirmDelete(false); onDeleted() }}
      />
    </>
  )
}

import { useState } from 'react'
import { Pencil, Trash2, Receipt } from 'lucide-react'
import { MarkerBadge } from '@/components/cairn/marker-badge'
import { RowActionsMenu } from '@/components/cairn/row-actions-menu'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { toDisplayMarker } from '@/lib/embedded-markers'
import { deleteCairnBurn, fetchCairnBurnReceiptUrl } from '@/lib/cairn-api'
import { InlineBurnForm } from './inline-burn-form'
import type { CairnBurn } from '@/lib/cairn-types'
import { useTerms } from '@/hooks/use-terminology'

interface Props {
  burn: CairnBurn
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  onSaved: () => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function BurnRow({ burn, tags, onSaved, onDeleted }: Props) {
  const terms = useTerms()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing) {
    return (
      <InlineBurnForm
        burn={burn}
        tags={tags}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  return (
    <>
      <div className="group flex items-center gap-3 px-4 py-2.5 hover:bg-muted/30">
        <div className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
          {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{burn.name}</span>
            {burn.markers.map((entry, i) => {
              const marker = toDisplayMarker(entry)
              if (!marker) return null
              return <MarkerBadge key={marker.id ?? i} marker={marker} />
            })}
          </div>
          {burn.notes ? <div className="truncate text-xs text-muted-foreground">{burn.notes}</div> : null}
        </div>
        {burn.receiptUrl ? (
          <button
            type="button"
            onClick={async () => {
              try {
                const url = await fetchCairnBurnReceiptUrl(burn.receiptUrl!)
                window.open(url, '_blank')
              } catch { /* ignore */ }
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Receipt className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className="shrink-0 text-sm font-medium tabular-nums">{fmt(burn.amount)}</div>
        <RowActionsMenu
          actions={[
            { id: 'edit', label: 'Edit', icon: <Pencil className="mr-2 h-4 w-4" />, onSelect: () => setEditing(true) },
            { id: 'delete', label: 'Remove', icon: <Trash2 className="mr-2 h-4 w-4" />, destructive: true, onSelect: () => setConfirmDelete(true) },
          ]}
        />
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`Remove ${terms.expenseSingular.toLowerCase()}?`}
        description={<>This will permanently remove &ldquo;{burn.name}&rdquo; and any attached receipt.</>}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { await deleteCairnBurn(burn.id); setConfirmDelete(false); onDeleted() }}
      />
    </>
  )
}

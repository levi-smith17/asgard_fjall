import { useState } from 'react'
import { Pencil, Trash2, Receipt } from 'lucide-react'
import { RunBadge } from '@/components/apps/run-badge'
import { RowActionsMenu } from '@/components/apps/row-actions-menu'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { toDisplayRun } from '@/lib/embedded-runir'
import { deleteFjallSurtr, fetchFjallSurtrReceiptUrl } from '@/lib/data-api'
import { InlineSurtrForm } from './inline-surtr-form'
import type { FjallSurtr } from '@/lib/data-types'
import { useTerms } from '@/hooks/use-terminology'

interface Props {
  surtr: FjallSurtr
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  onSaved: () => void
  onDeleted: () => void
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function SurtrRow({ surtr, tags, onSaved, onDeleted }: Props) {
  const terms = useTerms()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (editing) {
    return (
      <InlineSurtrForm
        surtr={surtr}
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
          {new Date(surtr.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{surtr.name}</span>
            {(surtr.runir ?? []).map((entry, i) => {
              const run = toDisplayRun(entry)
              if (!run) return null
              return <RunBadge key={run.id ?? i} run={run} />
            })}
          </div>
          {surtr.notes ? <div className="truncate text-xs text-muted-foreground">{surtr.notes}</div> : null}
        </div>
        {surtr.receiptUrl ? (
          <button
            type="button"
            onClick={async () => {
              try {
                const url = await fetchFjallSurtrReceiptUrl(surtr.receiptUrl!)
                window.open(url, '_blank')
              } catch { /* ignore */ }
            }}
            className="shrink-0 text-muted-foreground hover:text-foreground"
          >
            <Receipt className="h-3.5 w-3.5" />
          </button>
        ) : null}
        <div className="shrink-0 text-sm font-medium tabular-nums">{fmt(surtr.amount)}</div>
        <RowActionsMenu
          actions={[
            { id: 'edit', label: 'Edit', icon: <Pencil className="mr-2 h-4 w-4" />, onSelect: () => setEditing(true) },
            { id: 'delete', label: 'Remove', icon: <Trash2 className="mr-2 h-4 w-4" />, destructive: true, onSelect: () => setConfirmDelete(true) },
          ]}
        />
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`Remove ${terms.surtrSingular.toLowerCase()}?`}
        description={<>This will permanently remove &ldquo;{surtr.name}&rdquo; and any attached receipt.</>}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { await deleteFjallSurtr(surtr.id); setConfirmDelete(false); onDeleted() }}
      />
    </>
  )
}

import { useState } from 'react'
import { Pencil, Trash2, ExternalLink } from 'lucide-react'
import { Badge } from '@/components/core/ui/badge'
import { Switch } from '@/components/core/ui/switch'
import { MarkerBadge } from '@/components/cairn/marker-badge'
import { RowActionsMenu } from '@/components/cairn/row-actions-menu'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { toDisplayMarker } from '@/lib/embedded-markers'
import { deleteCairnSupplyline, toggleCairnSupplylineActive } from '@/lib/cairn-api'
import { daysUntilRenewal, getEffectiveNextRenewal } from '@/lib/cairn-supplyline-renewal'
import { InlineSupplylineForm } from './inline-supplyline-form'
import type { CairnSupplyline } from '@/lib/cairn-types'
import { useTerms } from '@/hooks/use-terminology'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

interface Props {
  supplyline: CairnSupplyline
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  onSaved: () => void
  onDeleted: () => void
}

export function SupplylineRow({ supplyline, tags, onSaved, onDeleted }: Props) {
  const terms = useTerms()
  const [editing, setEditing] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const effectiveRenewal = getEffectiveNextRenewal(supplyline.nextRenewal, supplyline.billingCycle)
  const daysUntil = daysUntilRenewal(supplyline.nextRenewal, supplyline.billingCycle)
  const renewingSoon = daysUntil <= 7 && supplyline.active

  if (editing) {
    return (
      <InlineSupplylineForm
        supplyline={supplyline}
        tags={tags}
        onSaved={() => { setEditing(false); onSaved() }}
        onCancel={() => setEditing(false)}
      />
    )
  }

  const actions = [
    { id: 'edit', label: 'Edit', icon: <Pencil className="mr-2 h-4 w-4" />, onSelect: () => setEditing(true) },
    ...(supplyline.url
      ? [{ id: 'open', label: 'Open link', icon: <ExternalLink className="mr-2 h-4 w-4" />, onSelect: () => window.open(supplyline.url!, '_blank') }]
      : []),
    { id: 'delete', label: 'Remove', icon: <Trash2 className="mr-2 h-4 w-4" />, destructive: true, onSelect: () => setConfirmDelete(true) },
  ]

  return (
    <>
      <div className={`group flex items-center gap-2 px-3 py-2 hover:bg-muted/30 ${!supplyline.active ? 'opacity-50' : ''}`}>
        <Switch
          checked={supplyline.active}
          onCheckedChange={async (checked) => { await toggleCairnSupplylineActive(supplyline.id, checked); onSaved() }}
          className="shrink-0 scale-75"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="truncate text-sm font-medium">{supplyline.name}</span>
            {renewingSoon ? (
              <Badge className="border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-xs text-amber-700 dark:text-amber-400">{daysUntil}d</Badge>
            ) : null}
            {supplyline.markers.map((entry, i) => {
              const marker = toDisplayMarker(entry)
              if (!marker) return null
              return <MarkerBadge key={marker.id ?? i} marker={marker} />
            })}
          </div>
          <div className="text-xs text-muted-foreground">
            renews {effectiveRenewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
        </div>
        <div className="shrink-0 text-right">
          <div className="text-sm font-medium tabular-nums">{fmt(supplyline.amount)}</div>
          <div className="text-xs text-muted-foreground">{CYCLE_LABELS[supplyline.billingCycle]}</div>
        </div>
        <RowActionsMenu actions={actions} />
      </div>
      <ConfirmDialog
        open={confirmDelete}
        title={`Remove ${terms.subscriptionSingular.toLowerCase()}?`}
        description={<>This will permanently remove &ldquo;{supplyline.name}&rdquo;.</>}
        confirmLabel="Remove"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={async () => { await deleteCairnSupplyline(supplyline.id); setConfirmDelete(false); onDeleted() }}
      />
    </>
  )
}

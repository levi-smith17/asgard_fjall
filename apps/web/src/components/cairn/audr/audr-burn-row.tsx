import { Receipt } from 'lucide-react'
import { MarkerBadge } from '@/components/cairn/marker-badge'
import { toDisplayMarker } from '@/lib/embedded-markers'
import { fetchCairnBurnReceiptUrl } from '@/lib/cairn-api'
import { audrFmt } from '@/lib/audr-format'
import { cn } from '@/lib/utils'
import type { CairnBurn } from '@/lib/cairn-types'

export function AudrBurnRow({
  burn,
  selected,
  onSelect,
  fundLabel,
}: {
  burn: CairnBurn
  selected: boolean
  onSelect: () => void
  /** When string, show fund badge; when null, show muted Unassigned; when undefined, hide. */
  fundLabel?: string | null
}) {
  return (
    <button
      type="button"
      data-inspectable
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors sm:px-6',
        selected ? 'bg-primary/10' : 'hover:bg-muted/50',
      )}
    >
      <div className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
        {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{burn.name}</span>
          {fundLabel !== undefined ? (
            <span className="inline-flex max-w-[10rem] truncate rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              {fundLabel ?? 'Unassigned'}
            </span>
          ) : null}
          {burn.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
        {burn.notes ? (
          <div className="truncate text-xs text-muted-foreground">{burn.notes}</div>
        ) : null}
      </div>
      {burn.receiptUrl ? (
        <span
          role="presentation"
          onClick={async (e) => {
            e.stopPropagation()
            try {
              const url = await fetchCairnBurnReceiptUrl(burn.receiptUrl!)
              window.open(url, '_blank')
            } catch {
              /* ignore */
            }
          }}
          className="shrink-0 text-muted-foreground hover:text-foreground"
        >
          <Receipt className="h-3.5 w-3.5" />
        </span>
      ) : null}
      <div className="shrink-0 text-sm font-medium tabular-nums">{audrFmt(burn.amount)}</div>
    </button>
  )
}

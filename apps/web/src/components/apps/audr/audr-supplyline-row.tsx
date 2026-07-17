import { Repeat } from 'lucide-react'
import { MarkerBadge } from '@/components/apps/marker-badge'
import { liveMarkersById, toDisplayMarker } from '@/lib/embedded-markers'
import { getEffectiveNextRenewal } from '@/lib/idunn-renewal'
import { audrFmt } from '@/lib/audr-format'
import { cn } from '@/lib/utils'
import type { FjallSupplyline } from '@/lib/data-types'
import type { AudrMarker } from './audr-types'

export function AudrSupplylineRow({
  supplyline,
  selected,
  onSelect,
  fundColor,
  fundName,
  markers = [],
}: {
  supplyline: FjallSupplyline
  selected: boolean
  onSelect: () => void
  /** Colored Sjodr swatch after the name; omit to hide. */
  fundColor?: string | null
  fundName?: string
  markers?: AudrMarker[]
}) {
  const liveById = liveMarkersById(markers)
  const effectiveRenewal = getEffectiveNextRenewal(supplyline.nextRenewal, supplyline.billingCycle)

  return (
    <button
      type="button"
      data-inspectable
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors sm:px-6',
        selected ? 'bg-primary/10' : 'hover:bg-muted/50',
        !supplyline.active && 'opacity-50',
      )}
    >
      <Repeat className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
        {effectiveRenewal.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{supplyline.name}</span>
          {fundColor ? (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: fundColor }}
              title={fundName}
              aria-label={fundName}
            />
          ) : null}
          {supplyline.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry, liveById)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
        {supplyline.notes ? (
          <div className="truncate text-xs text-muted-foreground">{supplyline.notes}</div>
        ) : null}
      </div>
      <div className="shrink-0 text-sm font-medium tabular-nums">{audrFmt(supplyline.amount)}</div>
    </button>
  )
}

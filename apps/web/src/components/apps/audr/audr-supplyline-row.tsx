import { Repeat } from 'lucide-react'
import { RunBadge } from '@/components/apps/run-badge'
import { liveRunirById, toDisplayRun } from '@/lib/embedded-runir'
import { getEffectiveNextRenewal, getRenewalInMonth } from '@/lib/idunn-renewal'
import { audrFmt } from '@/lib/audr-format'
import { cn } from '@/lib/utils'
import type { FjallSupplyline } from '@/lib/data-types'
import type { AudrRun } from './audr-types'

export function AudrSupplylineRow({
  supplyline,
  month,
  year,
  selected,
  onSelect,
  fundColor,
  fundName,
  runir = [],
}: {
  supplyline: FjallSupplyline
  month?: number
  year?: number
  selected: boolean
  onSelect: () => void
  /** Colored Sjodr swatch after the name; omit to hide. */
  fundColor?: string | null
  fundName?: string
  runir?: AudrRun[]
}) {
  const liveById = liveRunirById(runir)
  const effectiveRenewal =
    month != null && year != null
      ? (getRenewalInMonth(supplyline.nextRenewal, supplyline.billingCycle, month, year) ??
        getEffectiveNextRenewal(supplyline.nextRenewal, supplyline.billingCycle))
      : getEffectiveNextRenewal(supplyline.nextRenewal, supplyline.billingCycle)

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
          {(supplyline.runir ?? []).map((entry, i) => {
            const run = toDisplayRun(entry, liveById)
            if (!run) return null
            return <RunBadge key={run.id ?? i} run={run} />
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

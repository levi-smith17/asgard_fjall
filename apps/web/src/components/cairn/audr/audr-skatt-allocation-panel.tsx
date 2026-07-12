import { MarkerBadge } from '@/components/cairn/marker-badge'
import { toDisplayMarker, toMarkerId } from '@/lib/embedded-markers'
import { audrFmt, skattUtilizationColor } from '@/lib/audr-format'
import {
  effectiveSkattSpent,
  effectiveSkattUtilization,
  idunnSpendForMarker,
  supplylineCountsAgainstSkatt,
  supplylineMonthlyAmount,
} from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { CairnBurn, CairnCacheUtilization, CairnSupplyline } from '@/lib/cairn-types'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

export function AudrSkattAllocationPanel({
  cache,
  burns,
  supplylines,
}: {
  cache: CairnCacheUtilization
  burns: CairnBurn[]
  supplylines: CairnSupplyline[]
}) {
  const terms = useTerms()
  const idunnLines = supplylines.filter(
    (line) =>
      line.active &&
      supplylineCountsAgainstSkatt(line.billingCycle) &&
      line.markers.some((entry) => toMarkerId(entry) === cache.markerId),
  )
  const surtrSpend = cache.spent
  const idunnSpend = idunnSpendForMarker(supplylines, cache.markerId)
  const totalSpent = effectiveSkattSpent(cache, supplylines)
  const utilization = effectiveSkattUtilization(cache, supplylines)

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Allocation
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">{terms.expenses}</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(surtrSpend)}</span>
          <span className="text-muted-foreground">{terms.subscriptions}</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(idunnSpend)}</span>
          <span className="font-medium text-foreground">Total</span>
          <span className="text-right font-medium tabular-nums text-foreground">
            {audrFmt(totalSpent)}
          </span>
          <span className="text-muted-foreground">Limit</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(cache.limit)}</span>
        </div>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className={cn('h-full rounded-full transition-all', skattUtilizationColor(utilization))}
              style={{ width: `${Math.min(utilization, 100)}%` }}
            />
          </div>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {Math.round(utilization)}%
          </span>
        </div>
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {terms.expenses}
        </p>
        {burns.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No {terms.expenses.toLowerCase()} charged to this {terms.budgets.toLowerCase()}{' '}
            this month.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {burns.map((burn) => (
              <li
                key={burn.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{burn.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums font-medium">{audrFmt(burn.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {terms.subscriptions}
        </p>
        {idunnLines.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active {terms.subscriptions.toLowerCase()} counting toward this{' '}
            {terms.budgets.toLowerCase()}.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {idunnLines.map((line) => (
              <li
                key={line.id}
                className="flex items-start justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{line.name}</p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {line.markers.map((entry, index) => {
                      const marker = toDisplayMarker(entry)
                      if (!marker) return null
                      return <MarkerBadge key={marker.id ?? index} marker={marker} />
                    })}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {audrFmt(supplylineMonthlyAmount(line.amount, line.billingCycle))} / mo
                    <span className="text-muted-foreground/70">
                      {' '}
                      ({CYCLE_LABELS[line.billingCycle] ?? line.billingCycle})
                    </span>
                  </p>
                </div>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {audrFmt(line.amount)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

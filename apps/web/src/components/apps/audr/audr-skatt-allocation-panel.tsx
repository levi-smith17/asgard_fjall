import { RunBadge } from '@/components/apps/run-badge'
import { liveRunirById, toDisplayRun, toRunId } from '@/lib/embedded-runir'
import { audrFmt, skattUtilizationColor } from '@/lib/audr-format'
import {
  effectiveSkattSpent,
  effectiveSkattUtilization,
  idunnSpendForRun,
  idunnCountsAgainstSkatt,
  idunnMonthlyAmount,
} from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { FjallSurtr, FjallSkattUtilization, FjallIdunn } from '@/lib/data-types'
import type { AudrRun } from './audr-types'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

export function AudrSkattAllocationPanel({
  skatt,
  surtrItems,
  idunnItems,
  runir = [],
}: {
  skatt: FjallSkattUtilization
  surtrItems: FjallSurtr[]
  idunnItems: FjallIdunn[]
  runir?: AudrRun[]
}) {
  const terms = useTerms()
  const liveById = liveRunirById(runir)
  const idunnLines = idunnItems.filter(
    (line) =>
      line.active &&
      idunnCountsAgainstSkatt(line.billingCycle) &&
      (line.runir ?? []).some((entry) => toRunId(entry) === skatt.runId),
  )
  const surtrSpend = skatt.spent
  const idunnSpend = idunnSpendForRun(idunnItems, skatt.runId)
  const totalSpent = effectiveSkattSpent(skatt, idunnItems)
  const utilization = effectiveSkattUtilization(skatt, idunnItems)

  return (
    <div className="space-y-4 px-5 py-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Allocation
        </p>
        <div className="mt-2 grid grid-cols-2 gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs">
          <span className="text-muted-foreground">{terms.surtr}</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(surtrSpend)}</span>
          <span className="text-muted-foreground">{terms.idunn}</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(idunnSpend)}</span>
          <span className="font-medium text-foreground">Total</span>
          <span className="text-right font-medium tabular-nums text-foreground">
            {audrFmt(totalSpent)}
          </span>
          <span className="text-muted-foreground">Limit</span>
          <span className="text-right tabular-nums text-foreground">{audrFmt(skatt.limit)}</span>
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
          {terms.surtr}
        </p>
        {surtrItems.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No {terms.surtr.toLowerCase()} charged to this {terms.skatt.toLowerCase()}{' '}
            this month.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {surtrItems.map((surtr) => (
              <li
                key={surtr.id}
                className="flex items-center justify-between gap-2 rounded-md border border-border bg-card px-3 py-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{surtr.name}</p>
                  <p className="text-muted-foreground">
                    {new Date(surtr.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                <span className="shrink-0 tabular-nums font-medium">{audrFmt(surtr.amount)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {terms.idunn}
        </p>
        {idunnLines.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No active {terms.idunn.toLowerCase()} counting toward this{' '}
            {terms.skatt.toLowerCase()}.
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
                    {(line.runir ?? []).map((entry, index) => {
                      const run = toDisplayRun(entry, liveById)
                      if (!run) return null
                      return <RunBadge key={run.id ?? index} run={run} />
                    })}
                  </div>
                  <p className="mt-1 text-muted-foreground">
                    {audrFmt(idunnMonthlyAmount(line.amount, line.billingCycle))} / mo
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

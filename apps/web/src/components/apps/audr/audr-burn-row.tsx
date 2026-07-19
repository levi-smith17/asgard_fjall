import { BanknoteArrowDown, Receipt } from 'lucide-react'
import { RunBadge } from '@/components/apps/run-badge'
import { liveRunirById, toDisplayRun } from '@/lib/embedded-runir'
import { fetchFjallBurnReceiptUrl } from '@/lib/data-api'
import { audrFmt } from '@/lib/audr-format'
import { cn } from '@/lib/utils'
import type { FjallBurn } from '@/lib/data-types'
import type { AudrRun } from './audr-types'

export function AudrBurnRow({
  burn,
  selected,
  onSelect,
  fundColor,
  fundName,
  runir = [],
}: {
  burn: FjallBurn
  selected: boolean
  onSelect: () => void
  /** Colored Sjodr swatch after the name; omit to hide. */
  fundColor?: string | null
  fundName?: string
  runir?: AudrRun[]
}) {
  const liveById = liveRunirById(runir)

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
      <BanknoteArrowDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="w-14 shrink-0 text-xs tabular-nums text-muted-foreground">
        {new Date(burn.date.slice(0, 10).replace(/-/g, '/')).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="truncate text-sm font-medium">{burn.name}</span>
          {fundColor ? (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: fundColor }}
              title={fundName}
              aria-label={fundName}
            />
          ) : null}
          {(burn.runir ?? []).map((entry, i) => {
            const run = toDisplayRun(entry, liveById)
            if (!run) return null
            return <RunBadge key={run.id ?? i} run={run} />
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
              const url = await fetchFjallBurnReceiptUrl(burn.receiptUrl!)
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

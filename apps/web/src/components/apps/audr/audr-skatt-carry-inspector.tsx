import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ListChecks } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/core/ui/button'
import { StudioPagination } from '@/components/core/ui/studio-pagination'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { fetchAudrSummary } from '@/lib/data-api'
import {
  carryOverFjallCacheToMonth,
  carrySelectedFjallCacheToMonth,
} from '@/lib/skatt-carry-over'
import { audrFmt, monthYearLabel, shiftMonth, runShortLabel } from '@/lib/audr-format'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import type { AudrRun } from './audr-types'

export function AudrSkattCarryInspector({
  targetMonth,
  targetYear,
  targetRunIds,
  runir,
  onComplete,
}: {
  targetMonth: number
  targetYear: number
  targetRunIds: Set<string>
  runir: AudrRun[]
  onComplete: () => void
}) {
  const terms = useTerms()
  const defaultSource = shiftMonth(targetMonth, targetYear, -1)
  const [sourceMonth, setSourceMonth] = useState(defaultSource.month)
  const [sourceYear, setSourceYear] = useState(defaultSource.year)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [carrying, setCarrying] = useState(false)

  const sourceQuery = useQuery({
    queryKey: ['audr', 'skatt-carry-source', sourceMonth, sourceYear],
    queryFn: () => fetchAudrSummary(sourceMonth, sourceYear),
  })

  const sourceItems = sourceQuery.data?.skattUtilization ?? []

  const selectableItems = useMemo(
    () => sourceItems.filter((item) => !targetRunIds.has(item.runId)),
    [sourceItems, targetRunIds],
  )

  function toggleItem(runId: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(runId)) next.delete(runId)
      else next.add(runId)
      return next
    })
  }

  function selectAllSelectable() {
    setSelected(new Set(selectableItems.map((item) => item.runId)))
  }

  async function handleCarrySelected() {
    const items = sourceItems
      .filter((item) => selected.has(item.runId))
      .map((item) => ({ runId: item.runId, limit: item.limit }))
    if (items.length === 0) return

    setCarrying(true)
    try {
      const result = await carrySelectedFjallCacheToMonth(targetMonth, targetYear, items)
      const sourceName = monthYearLabel(sourceMonth, sourceYear)
      if (result.created > 0) {
        toast.success(
          `Brought ${result.created} ${terms.skatt.toLowerCase()} from ${sourceName}${
            result.skipped > 0 ? ` (${result.skipped} skipped)` : ''
          }`,
        )
      } else {
        toast.message(`No new ${terms.skatt.toLowerCase()} to bring forward`)
      }
      onComplete()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to bring Skatt forward')
    } finally {
      setCarrying(false)
    }
  }

  async function handleQuickCarry() {
    setCarrying(true)
    try {
      const result = await carryOverFjallCacheToMonth(targetMonth, targetYear)
      if (!result) {
        toast.message(`No previous ${terms.skatt.toLowerCase()} available`)
        return
      }
      const sourceName = monthYearLabel(result.sourceMonth, result.sourceYear)
      toast.success(`Copied ${result.count} ${terms.skatt.toLowerCase()} from ${sourceName}`)
      onComplete()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to copy Skatt')
    } finally {
      setCarrying(false)
    }
  }

  const sourceName = monthYearLabel(sourceMonth, sourceYear)
  const targetName = monthYearLabel(targetMonth, targetYear)

  useEffect(() => {
    setSelected(new Set())
  }, [sourceMonth, sourceYear])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow="Audr"
          title={`Bring ${terms.skattSingular} Forward`}
        />
      </InspectorChrome>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
          Select entries from a source month to copy into {targetName}.
        </p>

        <div className="flex items-center gap-2 border-b border-border px-5 py-3">
          <StudioPagination
            className="min-w-0 flex-1"
            aria-label="Source month"
            label={sourceName}
            onPrev={() => {
              const prev = shiftMonth(sourceMonth, sourceYear, -1)
              setSourceMonth(prev.month)
              setSourceYear(prev.year)
            }}
            onNext={() => {
              const next = shiftMonth(sourceMonth, sourceYear, 1)
              setSourceMonth(next.month)
              setSourceYear(next.year)
            }}
            canGoPrev
            canGoNext={
              !(
                sourceYear > targetYear ||
                (sourceYear === targetYear && sourceMonth >= targetMonth)
              )
            }
            prevLabel="Previous month"
            nextLabel="Next month"
          />
          <ToolbarTooltip label="Select all">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={selectAllSelectable}
              disabled={selectableItems.length === 0 || carrying}
              aria-label="Select all"
            >
              <ListChecks className="h-4 w-4" />
            </Button>
          </ToolbarTooltip>
        </div>

        {sourceQuery.isLoading ? (
          <div className="space-y-1 px-3 py-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : sourceItems.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            No {terms.skatt.toLowerCase()} in {sourceName}.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {sourceItems.map((item) => {
              const alreadyPresent = targetRunIds.has(item.runId)
              const label = runShortLabel(item.runId, runir, item)
              const checked = selected.has(item.runId)

              return (
                <li key={item.id}>
                  <label
                    className={cn(
                      'flex cursor-pointer items-center gap-3 px-5 py-3',
                      alreadyPresent ? 'cursor-not-allowed opacity-50' : 'hover:bg-muted/50',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={checked}
                      disabled={alreadyPresent || carrying}
                      onChange={() => toggleItem(item.runId)}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">
                        Limit {audrFmt(item.limit)}
                        {alreadyPresent ? ' · already in target month' : ''}
                      </div>
                    </div>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">
                      {audrFmt(item.spent)} spent
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          type="button"
          className="w-full"
          onClick={handleCarrySelected}
          disabled={carrying || selected.size === 0}
        >
          {carrying ? 'Bringing…' : `Bring ${selected.size} selected`}
        </Button>
      </div>
      <div className="shrink-0 border-t border-border px-5 py-4">
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={handleQuickCarry}
          disabled={carrying}
        >
          Carry all from previous month
        </Button>
      </div>
    </div>
  )
}

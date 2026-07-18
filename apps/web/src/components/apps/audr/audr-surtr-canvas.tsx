import { Plus } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { TableSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioPagination } from '@/components/core/ui/studio-pagination'
import {
  AUDR_UNASSIGNED_SJODR,
  audrFmt,
  buildSurtrCanvasGroups,
  buildSurtrSjodrSections,
  filterAudrBySjodr,
  runShortLabel,
  skattUtilizationColor,
  type AudrCanvasGroupBy,
  type SurtrCanvasGroup,
} from '@/lib/audr-format'
import { effectiveSkattSpent, effectiveSkattUtilization, idunnLinesForRun } from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type {
  FjallBurn,
  FjallCacheUtilization,
  FjallSjodrView,
  FjallSupplyline,
} from '@/lib/data-types'
import { resolveSjodrColor } from '@/lib/sjodr-color'
import type { AudrRun } from './audr-types'
import { AudrBurnRow } from './audr-burn-row'
import { AudrFilterBar } from './audr-filter-bar'
import { AudrSupplylineRow } from './audr-supplyline-row'

export function AudrSurtrCanvas({
  month,
  year,
  monthName,
  onPrevMonth,
  onNextMonth,
  search,
  onSearchChange,
  runFilter,
  onRunFilterChange,
  sjodrFilter,
  onSjodrFilterChange,
  groupBy,
  onGroupByChange,
  runir,
  funds,
  filtersActive,
  onClearFilters,
  onBringSkatt,
  onManageLaufar,
  onManageSjodr,
  burns,
  cacheUtilization,
  supplylines,
  burnsLoading,
  selectedBurnId,
  onSelectBurn,
  selectedSupplylineId,
  onSelectSupplyline,
  onSelectCache,
  onSelectCacheRun,
  onAddBurn,
  burnPage,
  burnTotal,
  burnPageSize,
  onBurnPageChange,
  burnPageLoading,
}: {
  month: number
  year: number
  monthName: string
  onPrevMonth: () => void
  onNextMonth: () => void
  search: string
  onSearchChange: (value: string) => void
  runFilter: string
  onRunFilterChange: (value: string) => void
  sjodrFilter: string
  onSjodrFilterChange: (value: string) => void
  groupBy: AudrCanvasGroupBy
  onGroupByChange: (value: AudrCanvasGroupBy) => void
  runir: AudrRun[]
  funds: FjallSjodrView[]
  filtersActive: boolean
  onClearFilters: () => void
  onBringSkatt: () => void
  onManageLaufar: () => void
  onManageSjodr: () => void
  burns: FjallBurn[]
  cacheUtilization: FjallCacheUtilization[]
  supplylines: FjallSupplyline[]
  burnsLoading: boolean
  selectedBurnId: string | null
  onSelectBurn: (id: string) => void
  selectedSupplylineId: string | null
  onSelectSupplyline: (id: string) => void
  onSelectCache: (id: string) => void
  onSelectCacheRun: (runId: string) => void
  onAddBurn: (runId?: string) => void
  burnPage: number
  burnTotal: number
  burnPageSize: number
  onBurnPageChange: (page: number) => void
  burnPageLoading: boolean
}) {
  const terms = useTerms()
  const fundNameById = new Map(funds.map((fund) => [fund.id, fund.name]))
  const fundColorById = new Map(
    funds.map((fund) => [fund.id, resolveSjodrColor(fund.id, fund.color)]),
  )

  const filteredCaches = filterAudrBySjodr(cacheUtilization, sjodrFilter)
  const filteredBurns =
    sjodrFilter === 'all'
      ? burns
      : burns.filter((burn) =>
          sjodrFilter === AUDR_UNASSIGNED_SJODR ? !burn.fundId : burn.fundId === sjodrFilter,
        )
  const filteredSupplylines =
    sjodrFilter === 'all'
      ? supplylines
      : supplylines.filter((line) =>
          sjodrFilter === AUDR_UNASSIGNED_SJODR ? !line.fundId : line.fundId === sjodrFilter,
        )

  const runGroups = buildSurtrCanvasGroups(filteredBurns, filteredCaches, runir).filter(
    (group) => runFilter === 'all' || group.runId === runFilter,
  )
  const sjodrSections = buildSurtrSjodrSections(
    filteredBurns,
    filteredCaches,
    funds,
    runir,
  )
    .map((section) => ({
      ...section,
      groups: section.groups.filter(
        (group) => runFilter === 'all' || group.runId === runFilter,
      ),
    }))
    .filter((section) => section.groups.length > 0)

  const hasContent = groupBy === 'sjodr' ? sjodrSections.length > 0 : runGroups.length > 0
  const totalPages = Math.max(1, Math.ceil(burnTotal / burnPageSize))

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <AudrFilterBar
        monthName={monthName}
        onPrevMonth={onPrevMonth}
        onNextMonth={onNextMonth}
        search={search}
        onSearchChange={onSearchChange}
        runFilter={runFilter}
        onRunFilterChange={onRunFilterChange}
        sjodrFilter={sjodrFilter}
        onSjodrFilterChange={onSjodrFilterChange}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        runir={runir}
        funds={funds}
        filtersActive={filtersActive}
        onClearFilters={onClearFilters}
        onBringSkatt={onBringSkatt}
        onManageLaufar={onManageLaufar}
        onManageSjodr={onManageSjodr}
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="min-h-0 flex-1 overflow-y-auto">
          {burnsLoading && !hasContent ? (
            <TableSkeleton rows={8} columns={4} />
          ) : !hasContent ? (
            <div className="px-4 py-8 text-sm text-muted-foreground sm:px-6">
              No {terms.budgets.toLowerCase()} or {terms.expenses.toLowerCase()} found.
            </div>
          ) : groupBy === 'sjodr' ? (
            <div className="flex flex-col">
              {sjodrSections.map((section) => {
                const sectionBurns = section.groups.flatMap((group) => group.burns)
                const sectionCaches = section.groups
                  .map((group) => group.cache)
                  .filter((cache): cache is FjallCacheUtilization => cache != null)
                const spent = sectionCaches.reduce(
                  (sum, cache) => sum + effectiveSkattSpent(cache, filteredSupplylines),
                  0,
                )
                const limit = sectionCaches.reduce((sum, cache) => sum + cache.limit, 0)
                const burnTotalAmount = sectionBurns.reduce((sum, burn) => sum + burn.amount, 0)
                const pct = limit > 0 ? (spent / limit) * 100 : 0

                return (
                  <div key={section.fundId ?? AUDR_UNASSIGNED_SJODR}>
                    <div className="pointer-events-none sticky top-0 z-[2] border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-sm sm:px-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex min-w-0 items-center gap-1.5 text-sm font-semibold text-foreground">
                            <span className="truncate">{section.fundName}</span>
                            {section.fundId && fundColorById.get(section.fundId) ? (
                              <span
                                className="inline-block h-2 w-2 shrink-0 rounded-full"
                                style={{
                                  backgroundColor: fundColorById.get(section.fundId),
                                }}
                                aria-hidden
                              />
                            ) : null}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {section.groups.length} {terms.budgets.toLowerCase()}
                            {sectionBurns.length > 0
                              ? ` · ${sectionBurns.length} ${terms.expenses.toLowerCase()}`
                              : null}
                          </p>
                        </div>
                        <div className="shrink-0 text-right">
                          {limit > 0 ? (
                            <p className="text-xs tabular-nums text-muted-foreground">
                              {audrFmt(spent)}{' '}
                              <span className="text-muted-foreground/70">/ {audrFmt(limit)}</span>
                            </p>
                          ) : (
                            <p className="text-xs text-muted-foreground">No {terms.budgets.toLowerCase()}</p>
                          )}
                          <p className="text-xs font-medium tabular-nums">{audrFmt(burnTotalAmount)}</p>
                        </div>
                      </div>
                      {limit > 0 ? (
                        <div className="mt-1.5 flex items-center gap-2">
                          <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                            <div
                              className={cn(
                                'h-full rounded-full transition-all',
                                skattUtilizationColor(pct),
                              )}
                              style={{ width: `${Math.min(pct, 100)}%` }}
                            />
                          </div>
                          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                            {Math.round(pct)}%
                          </span>
                        </div>
                      ) : null}
                    </div>
                    {section.groups.map((group) => (
                      <SkattGroupBlock
                        key={`${section.fundId ?? AUDR_UNASSIGNED_SJODR}:${group.runId}`}
                        group={group}
                        runir={runir}
                        month={month}
                        year={year}
                        supplylines={filteredSupplylines}
                        selectedBurnId={selectedBurnId}
                        selectedSupplylineId={selectedSupplylineId}
                        fundNameById={fundNameById}
                        fundColorById={fundColorById}
                        showFundBadge={false}
                        stickyClassName=""
                        onSelectBurn={onSelectBurn}
                        onSelectSupplyline={onSelectSupplyline}
                        onSelectCache={onSelectCache}
                        onSelectCacheRun={onSelectCacheRun}
                        onAddBurn={onAddBurn}
                      />
                    ))}
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col">
              {runGroups.map((group) => (
                <SkattGroupBlock
                  key={group.runId}
                  group={group}
                  runir={runir}
                  month={month}
                  year={year}
                  supplylines={filteredSupplylines}
                  selectedBurnId={selectedBurnId}
                  selectedSupplylineId={selectedSupplylineId}
                  fundNameById={fundNameById}
                  fundColorById={fundColorById}
                  showFundBadge
                  stickyClassName="sticky top-0 z-[1]"
                  onSelectBurn={onSelectBurn}
                  onSelectSupplyline={onSelectSupplyline}
                  onSelectCache={onSelectCache}
                  onSelectCacheRun={onSelectCacheRun}
                  onAddBurn={onAddBurn}
                />
              ))}
            </div>
          )}
        </div>

        {burnTotal > burnPageSize ? (
          <div className="flex shrink-0 items-center justify-center border-t border-border px-4 py-2 sm:px-6">
            <StudioPagination
              aria-label="Expense pagination"
              label={`${burnPage} / ${totalPages}`}
              onPrev={() => onBurnPageChange(burnPage - 1)}
              onNext={() => onBurnPageChange(burnPage + 1)}
              canGoPrev={burnPage > 1 && !burnPageLoading}
              canGoNext={burnPage < totalPages && !burnPageLoading}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

function SkattGroupBlock({
  group,
  runir,
  month,
  year,
  supplylines,
  selectedBurnId,
  selectedSupplylineId,
  fundNameById,
  fundColorById,
  showFundBadge,
  stickyClassName,
  onSelectBurn,
  onSelectSupplyline,
  onSelectCache,
  onSelectCacheRun,
  onAddBurn,
}: {
  group: SurtrCanvasGroup
  runir: AudrRun[]
  month: number
  year: number
  supplylines: FjallSupplyline[]
  selectedBurnId: string | null
  selectedSupplylineId: string | null
  fundNameById: Map<string, string>
  fundColorById: Map<string, string>
  showFundBadge: boolean
  stickyClassName: string
  onSelectBurn: (id: string) => void
  onSelectSupplyline: (id: string) => void
  onSelectCache: (id: string) => void
  onSelectCacheRun: (runId: string) => void
  onAddBurn: (runId?: string) => void
}) {
  const terms = useTerms()
  const { runId, burns: groupBurns, cache } = group
  const groupSupplylines = idunnLinesForRun(supplylines, runId, month, year)
  const groupTotal = groupBurns.reduce((sum, burn) => sum + burn.amount, 0)
  const label = runShortLabel(runId, runir, cache)
  const spent = cache ? effectiveSkattSpent(cache, supplylines) : 0
  const pct = cache ? effectiveSkattUtilization(cache, supplylines) : 0
  const hasSkatt = cache != null
  const cacheFundColor =
    showFundBadge && cache?.fundId ? fundColorById.get(cache.fundId) : undefined
  const cacheFundName =
    showFundBadge && cache?.fundId ? fundNameById.get(cache.fundId) : undefined
  const rowCount = groupBurns.length + groupSupplylines.length

  return (
    <div>
      <div
        className={cn(
          'pointer-events-none flex items-start gap-2 border-b border-border bg-muted/90 px-4 py-2 backdrop-blur-sm sm:px-6',
          stickyClassName,
        )}
      >
        <button
          type="button"
          data-inspectable
          onClick={() => {
            if (cache?.id) onSelectCache(cache.id)
            else onSelectCacheRun(runId)
          }}
          className="pointer-events-auto min-w-0 flex-1 text-left transition-colors hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="truncate">{label}</span>
              {cacheFundColor ? (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: cacheFundColor }}
                  title={cacheFundName}
                  aria-label={cacheFundName}
                />
              ) : null}
              {rowCount > 0 ? (
                <span className="font-normal normal-case">({rowCount})</span>
              ) : null}
            </span>
            <div className="flex shrink-0 items-center gap-3">
              {hasSkatt ? (
                <span className="text-xs tabular-nums text-muted-foreground">
                  {audrFmt(spent)}{' '}
                  <span className="text-muted-foreground/70">/ {audrFmt(cache.limit)}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No {terms.budgets.toLowerCase()}</span>
              )}
              <span className="text-xs font-medium tabular-nums">{audrFmt(groupTotal)}</span>
            </div>
          </div>
          {hasSkatt ? (
            <div className="mt-1.5 flex items-center gap-2">
              <div className="h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn('h-full rounded-full transition-all', skattUtilizationColor(pct))}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
              <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
                {Math.round(pct)}%
              </span>
            </div>
          ) : null}
        </button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          className="pointer-events-auto mt-0.5 h-9 w-9 shrink-0"
          title={`Add ${terms.expenseSingular}`}
          aria-label={`Add ${terms.expenseSingular}`}
          onClick={() => onAddBurn(runId === 'uncategorized' ? undefined : runId)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {rowCount > 0 ? (
        <div className="divide-y divide-border">
          {groupBurns.map((burn) => (
            <AudrBurnRow
              key={burn.id}
              burn={burn}
              selected={selectedBurnId === burn.id}
              onSelect={() => onSelectBurn(burn.id)}
              runir={runir}
              fundColor={
                showFundBadge && burn.fundId ? (fundColorById.get(burn.fundId) ?? null) : undefined
              }
              fundName={
                showFundBadge && burn.fundId
                  ? (fundNameById.get(burn.fundId) ?? undefined)
                  : undefined
              }
            />
          ))}
          {groupSupplylines.map((line) => (
            <AudrSupplylineRow
              key={line.id}
              supplyline={line}
              month={month}
              year={year}
              selected={selectedSupplylineId === line.id}
              onSelect={() => onSelectSupplyline(line.id)}
              runir={runir}
              fundColor={
                showFundBadge && line.fundId ? (fundColorById.get(line.fundId) ?? null) : undefined
              }
              fundName={
                showFundBadge && line.fundId
                  ? (fundNameById.get(line.fundId) ?? undefined)
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="border-b border-border px-4 py-4 text-xs text-muted-foreground sm:px-6">
          No {terms.expenses.toLowerCase()} or {terms.subscriptions.toLowerCase()} in this{' '}
          {terms.budgets.toLowerCase()} yet.
        </div>
      )}
    </div>
  )
}

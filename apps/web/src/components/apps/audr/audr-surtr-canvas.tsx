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
  FjallSurtr,
  FjallSkattUtilization,
  FjallSjodrView,
  FjallIdunn,
} from '@/lib/data-types'
import { resolveSjodrColor } from '@/lib/sjodr-color'
import type { AudrRun } from './audr-types'
import { AudrSurtrRow } from './audr-surtr-row'
import { AudrFilterBar } from './audr-filter-bar'
import { AudrIdunnRow } from './audr-idunn-row'

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
  surtrItems,
  skattUtilization,
  idunnItems,
  surtrLoading,
  selectedSurtrId,
  onSelectSurtr,
  selectedIdunnId,
  onSelectIdunn,
  onSelectSkatt,
  onSelectSkattRun,
  onAddSurtr,
  surtrPage,
  surtrTotal,
  surtrPageSize,
  onSurtrPageChange,
  surtrPageLoading,
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
  surtrItems: FjallSurtr[]
  skattUtilization: FjallSkattUtilization[]
  idunnItems: FjallIdunn[]
  surtrLoading: boolean
  selectedSurtrId: string | null
  onSelectSurtr: (id: string) => void
  selectedIdunnId: string | null
  onSelectIdunn: (id: string) => void
  onSelectSkatt: (id: string) => void
  onSelectSkattRun: (runId: string) => void
  onAddSurtr: (runId?: string) => void
  surtrPage: number
  surtrTotal: number
  surtrPageSize: number
  onSurtrPageChange: (page: number) => void
  surtrPageLoading: boolean
}) {
  const terms = useTerms()
  const fundNameById = new Map(funds.map((fund) => [fund.id, fund.name]))
  const fundColorById = new Map(
    funds.map((fund) => [fund.id, resolveSjodrColor(fund.id, fund.color)]),
  )

  const filteredSkatt = filterAudrBySjodr(skattUtilization, sjodrFilter)
  const filteredSurtr =
    sjodrFilter === 'all'
      ? surtrItems
      : surtrItems.filter((surtr) =>
          sjodrFilter === AUDR_UNASSIGNED_SJODR ? !surtr.fundId : surtr.fundId === sjodrFilter,
        )
  const filteredIdunn =
    sjodrFilter === 'all'
      ? idunnItems
      : idunnItems.filter((line) =>
          sjodrFilter === AUDR_UNASSIGNED_SJODR ? !line.fundId : line.fundId === sjodrFilter,
        )

  const runGroups = buildSurtrCanvasGroups(filteredSurtr, filteredSkatt, runir).filter(
    (group) => runFilter === 'all' || group.runId === runFilter,
  )
  const sjodrSections = buildSurtrSjodrSections(
    filteredSurtr,
    filteredSkatt,
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
  const totalPages = Math.max(1, Math.ceil(surtrTotal / surtrPageSize))

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
          {surtrLoading && !hasContent ? (
            <TableSkeleton rows={8} columns={4} />
          ) : !hasContent ? (
            <div className="px-4 py-8 text-sm text-muted-foreground sm:px-6">
              No {terms.skatt.toLowerCase()} or {terms.surtr.toLowerCase()} found.
            </div>
          ) : groupBy === 'sjodr' ? (
            <div className="flex flex-col">
              {sjodrSections.map((section) => {
                const sectionSurtr = section.groups.flatMap((group) => group.surtrItems)
                const sectionSkatt = section.groups
                  .map((group) => group.skatt)
                  .filter((skatt): skatt is FjallSkattUtilization => skatt != null)
                const spent = sectionSkatt.reduce(
                  (sum, skatt) => sum + effectiveSkattSpent(skatt, filteredIdunn),
                  0,
                )
                const limit = sectionSkatt.reduce((sum, skatt) => sum + skatt.limit, 0)
                const surtrTotalAmount = sectionSurtr.reduce((sum, surtr) => sum + surtr.amount, 0)
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
                            {section.groups.length} {terms.skatt.toLowerCase()}
                            {sectionSurtr.length > 0
                              ? ` · ${sectionSurtr.length} ${terms.surtr.toLowerCase()}`
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
                            <p className="text-xs text-muted-foreground">No {terms.skatt.toLowerCase()}</p>
                          )}
                          <p className="text-xs font-medium tabular-nums">{audrFmt(surtrTotalAmount)}</p>
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
                        idunnItems={filteredIdunn}
                        selectedSurtrId={selectedSurtrId}
                        selectedIdunnId={selectedIdunnId}
                        fundNameById={fundNameById}
                        fundColorById={fundColorById}
                        showFundBadge={false}
                        stickyClassName=""
                        onSelectSurtr={onSelectSurtr}
                        onSelectIdunn={onSelectIdunn}
                        onSelectSkatt={onSelectSkatt}
                        onSelectSkattRun={onSelectSkattRun}
                        onAddSurtr={onAddSurtr}
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
                  idunnItems={filteredIdunn}
                  selectedSurtrId={selectedSurtrId}
                  selectedIdunnId={selectedIdunnId}
                  fundNameById={fundNameById}
                  fundColorById={fundColorById}
                  showFundBadge
                  stickyClassName="sticky top-0 z-[1]"
                  onSelectSurtr={onSelectSurtr}
                  onSelectIdunn={onSelectIdunn}
                  onSelectSkatt={onSelectSkatt}
                  onSelectSkattRun={onSelectSkattRun}
                  onAddSurtr={onAddSurtr}
                />
              ))}
            </div>
          )}
        </div>

        {surtrTotal > surtrPageSize ? (
          <div className="flex shrink-0 items-center justify-center border-t border-border px-4 py-2 sm:px-6">
            <StudioPagination
              aria-label="Expense pagination"
              label={`${surtrPage} / ${totalPages}`}
              onPrev={() => onSurtrPageChange(surtrPage - 1)}
              onNext={() => onSurtrPageChange(surtrPage + 1)}
              canGoPrev={surtrPage > 1 && !surtrPageLoading}
              canGoNext={surtrPage < totalPages && !surtrPageLoading}
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
  idunnItems,
  selectedSurtrId,
  selectedIdunnId,
  fundNameById,
  fundColorById,
  showFundBadge,
  stickyClassName,
  onSelectSurtr,
  onSelectIdunn,
  onSelectSkatt,
  onSelectSkattRun,
  onAddSurtr,
}: {
  group: SurtrCanvasGroup
  runir: AudrRun[]
  month: number
  year: number
  idunnItems: FjallIdunn[]
  selectedSurtrId: string | null
  selectedIdunnId: string | null
  fundNameById: Map<string, string>
  fundColorById: Map<string, string>
  showFundBadge: boolean
  stickyClassName: string
  onSelectSurtr: (id: string) => void
  onSelectIdunn: (id: string) => void
  onSelectSkatt: (id: string) => void
  onSelectSkattRun: (runId: string) => void
  onAddSurtr: (runId?: string) => void
}) {
  const terms = useTerms()
  const { runId, surtrItems: groupSurtr, skatt } = group
  const groupIdunn = idunnLinesForRun(idunnItems, runId, month, year)
  const groupTotal = groupSurtr.reduce((sum, surtr) => sum + surtr.amount, 0)
  const label = runShortLabel(runId, runir, skatt)
  const spent = skatt ? effectiveSkattSpent(skatt, idunnItems) : 0
  const pct = skatt ? effectiveSkattUtilization(skatt, idunnItems) : 0
  const hasSkatt = skatt != null
  const skattFundColor =
    showFundBadge && skatt?.fundId ? fundColorById.get(skatt.fundId) : undefined
  const skattFundName =
    showFundBadge && skatt?.fundId ? fundNameById.get(skatt.fundId) : undefined
  const rowCount = groupSurtr.length + groupIdunn.length

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
            if (skatt?.id) onSelectSkatt(skatt.id)
            else onSelectSkattRun(runId)
          }}
          className="pointer-events-auto min-w-0 flex-1 text-left transition-colors hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="flex min-w-0 flex-wrap items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              <span className="truncate">{label}</span>
              {skattFundColor ? (
                <span
                  className="inline-block h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: skattFundColor }}
                  title={skattFundName}
                  aria-label={skattFundName}
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
                  <span className="text-muted-foreground/70">/ {audrFmt(skatt.limit)}</span>
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">No {terms.skatt.toLowerCase()}</span>
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
          title={`Add ${terms.surtrSingular}`}
          aria-label={`Add ${terms.surtrSingular}`}
          onClick={() => onAddSurtr(runId === 'uncategorized' ? undefined : runId)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {rowCount > 0 ? (
        <div className="divide-y divide-border">
          {groupSurtr.map((surtr) => (
            <AudrSurtrRow
              key={surtr.id}
              surtr={surtr}
              selected={selectedSurtrId === surtr.id}
              onSelect={() => onSelectSurtr(surtr.id)}
              runir={runir}
              fundColor={
                showFundBadge && surtr.fundId ? (fundColorById.get(surtr.fundId) ?? null) : undefined
              }
              fundName={
                showFundBadge && surtr.fundId
                  ? (fundNameById.get(surtr.fundId) ?? undefined)
                  : undefined
              }
            />
          ))}
          {groupIdunn.map((line) => (
            <AudrIdunnRow
              key={line.id}
              idunn={line}
              month={month}
              year={year}
              selected={selectedIdunnId === line.id}
              onSelect={() => onSelectIdunn(line.id)}
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
          No {terms.surtr.toLowerCase()} or {terms.idunn.toLowerCase()} in this{' '}
          {terms.skatt.toLowerCase()} yet.
        </div>
      )}
    </div>
  )
}

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
  markerShortLabel,
  skattUtilizationColor,
  type AudrCanvasGroupBy,
  type SurtrCanvasGroup,
} from '@/lib/audr-format'
import { effectiveSkattSpent, effectiveSkattUtilization } from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type {
  CairnBurn,
  CairnCacheUtilization,
  CairnSjodrView,
  CairnSupplyline,
} from '@/lib/cairn-types'
import type { AudrMarker } from './audr-types'
import { AudrBurnRow } from './audr-burn-row'
import { AudrFilterBar } from './audr-filter-bar'

export function AudrSurtrCanvas({
  monthName,
  onPrevMonth,
  onNextMonth,
  search,
  onSearchChange,
  markerFilter,
  onMarkerFilterChange,
  sjodrFilter,
  onSjodrFilterChange,
  groupBy,
  onGroupByChange,
  markers,
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
  onSelectCache,
  onSelectCacheMarker,
  onAddBurn,
  burnPage,
  burnTotal,
  burnPageSize,
  onBurnPageChange,
  burnPageLoading,
}: {
  monthName: string
  onPrevMonth: () => void
  onNextMonth: () => void
  search: string
  onSearchChange: (value: string) => void
  markerFilter: string
  onMarkerFilterChange: (value: string) => void
  sjodrFilter: string
  onSjodrFilterChange: (value: string) => void
  groupBy: AudrCanvasGroupBy
  onGroupByChange: (value: AudrCanvasGroupBy) => void
  markers: AudrMarker[]
  funds: CairnSjodrView[]
  filtersActive: boolean
  onClearFilters: () => void
  onBringSkatt: () => void
  onManageLaufar: () => void
  onManageSjodr: () => void
  burns: CairnBurn[]
  cacheUtilization: CairnCacheUtilization[]
  supplylines: CairnSupplyline[]
  burnsLoading: boolean
  selectedBurnId: string | null
  onSelectBurn: (id: string) => void
  onSelectCache: (id: string) => void
  onSelectCacheMarker: (markerId: string) => void
  onAddBurn: (markerId?: string) => void
  burnPage: number
  burnTotal: number
  burnPageSize: number
  onBurnPageChange: (page: number) => void
  burnPageLoading: boolean
}) {
  const terms = useTerms()
  const fundNameById = new Map(funds.map((fund) => [fund.id, fund.name]))

  const filteredCaches = filterAudrBySjodr(cacheUtilization, sjodrFilter)
  const filteredBurns =
    sjodrFilter === 'all'
      ? burns
      : burns.filter((burn) =>
          sjodrFilter === AUDR_UNASSIGNED_SJODR ? !burn.fundId : burn.fundId === sjodrFilter,
        )

  const runGroups = buildSurtrCanvasGroups(filteredBurns, filteredCaches, markers).filter(
    (group) => markerFilter === 'all' || group.markerId === markerFilter,
  )
  const sjodrSections = buildSurtrSjodrSections(
    filteredBurns,
    filteredCaches,
    funds,
    markers,
  )
    .map((section) => ({
      ...section,
      groups: section.groups.filter(
        (group) => markerFilter === 'all' || group.markerId === markerFilter,
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
        markerFilter={markerFilter}
        onMarkerFilterChange={onMarkerFilterChange}
        sjodrFilter={sjodrFilter}
        onSjodrFilterChange={onSjodrFilterChange}
        groupBy={groupBy}
        onGroupByChange={onGroupByChange}
        markers={markers}
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
                  .filter((cache): cache is CairnCacheUtilization => cache != null)
                const spent = sectionCaches.reduce(
                  (sum, cache) => sum + effectiveSkattSpent(cache, supplylines),
                  0,
                )
                const limit = sectionCaches.reduce((sum, cache) => sum + cache.limit, 0)
                const burnTotalAmount = sectionBurns.reduce((sum, burn) => sum + burn.amount, 0)
                const pct = limit > 0 ? (spent / limit) * 100 : 0

                return (
                  <div key={section.fundId ?? AUDR_UNASSIGNED_SJODR}>
                    <div className="sticky top-0 z-[2] border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur-sm sm:px-6">
                      <div className="flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-foreground">
                            {section.fundName}
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
                        key={`${section.fundId ?? AUDR_UNASSIGNED_SJODR}:${group.markerId}`}
                        group={group}
                        markers={markers}
                        supplylines={supplylines}
                        selectedBurnId={selectedBurnId}
                        fundNameById={fundNameById}
                        showFundBadge={false}
                        stickyClassName=""
                        onSelectBurn={onSelectBurn}
                        onSelectCache={onSelectCache}
                        onSelectCacheMarker={onSelectCacheMarker}
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
                  key={group.markerId}
                  group={group}
                  markers={markers}
                  supplylines={supplylines}
                  selectedBurnId={selectedBurnId}
                  fundNameById={fundNameById}
                  showFundBadge
                  stickyClassName="sticky top-0 z-[1]"
                  onSelectBurn={onSelectBurn}
                  onSelectCache={onSelectCache}
                  onSelectCacheMarker={onSelectCacheMarker}
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
  markers,
  supplylines,
  selectedBurnId,
  fundNameById,
  showFundBadge,
  stickyClassName,
  onSelectBurn,
  onSelectCache,
  onSelectCacheMarker,
  onAddBurn,
}: {
  group: SurtrCanvasGroup
  markers: AudrMarker[]
  supplylines: CairnSupplyline[]
  selectedBurnId: string | null
  fundNameById: Map<string, string>
  showFundBadge: boolean
  stickyClassName: string
  onSelectBurn: (id: string) => void
  onSelectCache: (id: string) => void
  onSelectCacheMarker: (markerId: string) => void
  onAddBurn: (markerId?: string) => void
}) {
  const terms = useTerms()
  const { markerId, burns: groupBurns, cache } = group
  const groupTotal = groupBurns.reduce((sum, burn) => sum + burn.amount, 0)
  const label = markerShortLabel(markerId, markers, cache)
  const spent = cache ? effectiveSkattSpent(cache, supplylines) : 0
  const pct = cache ? effectiveSkattUtilization(cache, supplylines) : 0
  const hasSkatt = cache != null

  return (
    <div>
      <div
        className={cn(
          'flex items-start gap-2 border-b border-border bg-muted/90 px-4 py-2 backdrop-blur-sm sm:px-6',
          stickyClassName,
        )}
      >
        <button
          type="button"
          data-inspectable
          onClick={() => {
            if (cache) onSelectCache(cache.id)
            else onSelectCacheMarker(markerId)
          }}
          className="min-w-0 flex-1 text-left transition-colors hover:opacity-80"
        >
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
              {groupBurns.length > 0 ? (
                <span className="ml-2 font-normal normal-case">({groupBurns.length})</span>
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
          className="mt-0.5 h-9 w-9 shrink-0"
          title={`Add ${terms.expenseSingular}`}
          aria-label={`Add ${terms.expenseSingular}`}
          onClick={() => onAddBurn(markerId === 'uncategorized' ? undefined : markerId)}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
      {groupBurns.length > 0 ? (
        <div className="divide-y divide-border">
          {groupBurns.map((burn) => (
            <AudrBurnRow
              key={burn.id}
              burn={burn}
              selected={selectedBurnId === burn.id}
              onSelect={() => onSelectBurn(burn.id)}
              fundLabel={
                showFundBadge && burn.fundId
                  ? (fundNameById.get(burn.fundId) ?? 'Fund')
                  : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="border-b border-border px-4 py-4 text-xs text-muted-foreground sm:px-6">
          No {terms.expenses.toLowerCase()} in this {terms.budgets.toLowerCase()} yet.
        </div>
      )}
    </div>
  )
}

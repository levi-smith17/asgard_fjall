import { Plus } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { TableSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioPagination } from '@/components/core/ui/studio-pagination'
import {
  audrFmt,
  buildSurtrCanvasGroups,
  markerShortLabel,
  skattUtilizationColor,
} from '@/lib/audr-format'
import { effectiveSkattSpent, effectiveSkattUtilization } from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { CairnBurn, CairnCacheUtilization, CairnSupplyline } from '@/lib/cairn-types'
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
  markers,
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
  markers: AudrMarker[]
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
  const groups = buildSurtrCanvasGroups(burns, cacheUtilization, markers).filter(
    (group) => markerFilter === 'all' || group.markerId === markerFilter,
  )
  const totalPages = Math.max(1, Math.ceil(burnTotal / burnPageSize))
  const hasContent = groups.length > 0

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
        markers={markers}
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
          ) : (
            <div className="flex flex-col">
              {groups.map(({ markerId, burns: groupBurns, cache }) => {
                const groupTotal = groupBurns.reduce((sum, b) => sum + b.amount, 0)
                const label = markerShortLabel(markerId, markers, cache)
                const spent = cache ? effectiveSkattSpent(cache, supplylines) : 0
                const pct = cache ? effectiveSkattUtilization(cache, supplylines) : 0
                const hasSkatt = cache != null

                return (
                  <div key={markerId}>
                    <div className="sticky top-0 z-[1] flex items-start gap-2 border-b border-border bg-muted/90 px-4 py-2 backdrop-blur-sm sm:px-6">
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
                              <span className="ml-2 font-normal normal-case">
                                ({groupBurns.length})
                              </span>
                            ) : null}
                          </span>
                          <div className="flex shrink-0 items-center gap-3">
                            {hasSkatt ? (
                              <span className="text-xs tabular-nums text-muted-foreground">
                                {audrFmt(spent)}{' '}
                                <span className="text-muted-foreground/70">
                                  / {audrFmt(cache.limit)}
                                </span>
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">
                                No {terms.budgets.toLowerCase()}
                              </span>
                            )}
                            <span className="text-xs font-medium tabular-nums">
                              {audrFmt(groupTotal)}
                            </span>
                          </div>
                        </div>
                        {hasSkatt ? (
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
              })}
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

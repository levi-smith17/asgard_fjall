import { useState } from 'react'
import { Copy } from 'lucide-react'
import { ContextBarSearch } from '@/components/core/layout/context-bar-search'
import {
  FilterPaletteField,
  FilterPaletteStack,
} from '@/components/core/layout/filter-palette-field'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/core/layout/studio-data-toolbar'
import { Select } from '@/components/core/ui/select'
import { StudioPagination } from '@/components/core/ui/studio-pagination'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import {
  AUDR_UNASSIGNED_SJODR,
  type AudrCanvasGroupBy,
} from '@/lib/audr-format'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { CairnSjodrView } from '@/lib/cairn-types'
import type { AudrMarker } from './audr-types'
import { resolveSjodrColor } from '@/lib/sjodr-color'

export function AudrFilterBar({
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
}) {
  const terms = useTerms()
  const LaufarIcon = ASGARD_ENTITY_ICONS.laufar
  const SjodrIcon = ASGARD_ENTITY_ICONS.sjodr
  const [searchExpanded, setSearchExpanded] = useState(
    () =>
      search.trim().length > 0 || markerFilter !== 'all' || sjodrFilter !== 'all' || groupBy !== 'run',
  )

  const sjodrOptions = [
    { value: 'all', label: `All ${terms.sjodr}` },
    { value: AUDR_UNASSIGNED_SJODR, label: 'Unassigned' },
    ...funds.map((fund) => ({
      value: fund.id,
      label: fund.name,
      color: resolveSjodrColor(fund.id, fund.color),
    })),
  ]

  return (
    <div className={cn(STUDIO_CONTEXT_BAR_CLASS, 'z-30')}>
      <div className="flex w-full min-w-0 items-center gap-2">
        <span className="shrink-0 text-sm font-semibold text-foreground">{terms.expenses}</span>
        <StudioPagination
          className="shrink-0"
          aria-label="Month"
          label={monthName}
          onPrev={onPrevMonth}
          onNext={onNextMonth}
          canGoPrev
          canGoNext
          prevLabel="Previous month"
          nextLabel="Next month"
        />

        <div className="ml-auto flex shrink-0 items-center gap-2">
          <ContextBarSearch
            expanded={searchExpanded}
            onExpandedChange={setSearchExpanded}
            query={search}
            onQueryChange={onSearchChange}
            placeholder={`Filter ${terms.expenses}…`}
            tooltipLabel={`Filter ${terms.expenses}`}
            triggerIcon="filter"
            active={filtersActive}
            onClearAll={onClearFilters}
            expandedPanel={
              <FilterPaletteStack>
                {markers.length > 0 ? (
                  <FilterPaletteField label={terms.runSingular}>
                    <MarkerPicker
                      markers={markers}
                      selected={markerFilter !== 'all' ? [markerFilter] : []}
                      onChange={(ids) => onMarkerFilterChange(ids[0] ?? 'all')}
                      singleSelect
                      toolbar
                      placeholder={`All ${terms.runir}`}
                      initialPath={['Audr']}
                    />
                  </FilterPaletteField>
                ) : null}
                <FilterPaletteField label={terms.sjodrSingular}>
                  <Select
                    value={sjodrFilter}
                    onChange={onSjodrFilterChange}
                    options={sjodrOptions}
                  />
                </FilterPaletteField>
                <FilterPaletteField label="Group">
                  <Select
                    value={groupBy}
                    onChange={(value) => onGroupByChange(value === 'sjodr' ? 'sjodr' : 'run')}
                    options={[
                      { value: 'run', label: `By ${terms.runSingular}` },
                      { value: 'sjodr', label: `By ${terms.sjodrSingular}` },
                    ]}
                  />
                </FilterPaletteField>
              </FilterPaletteStack>
            }
          />
          <ToolbarTooltip label={`Audr ${terms.laufar}`}>
            <button
              type="button"
              onClick={onManageLaufar}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Manage Audr ${terms.laufar}`}
            >
              <LaufarIcon className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label={terms.sjodr}>
            <button
              type="button"
              onClick={onManageSjodr}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={terms.sjodr}
            >
              <SjodrIcon className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label={`Bring ${terms.budgets} Forward`}>
            <button
              type="button"
              onClick={onBringSkatt}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Bring ${terms.budgets} forward`}
            >
              <Copy className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        </div>
      </div>
    </div>
  )
}

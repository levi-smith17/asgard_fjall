import { useState } from 'react'
import { Copy } from 'lucide-react'
import { ContextBarSearch } from '@/components/core/layout/context-bar-search'
import {
  FilterPaletteField,
  FilterPaletteStack,
} from '@/components/core/layout/filter-palette-field'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/core/layout/studio-data-toolbar'
import { StudioPagination } from '@/components/core/ui/studio-pagination'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { AudrMarker } from './audr-types'

export function AudrFilterBar({
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
}) {
  const terms = useTerms()
  const LaufarIcon = ASGARD_ENTITY_ICONS.laufar
  const [searchExpanded, setSearchExpanded] = useState(
    () => search.trim().length > 0 || markerFilter !== 'all',
  )

  return (
    <div className={cn(STUDIO_CONTEXT_BAR_CLASS)}>
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
              markers.length > 0 ? (
                <FilterPaletteStack>
                  <FilterPaletteField label={terms.runSingular}>
                    <MarkerPicker
                      markers={markers}
                      selected={markerFilter !== 'all' ? [markerFilter] : []}
                      onChange={(ids) => onMarkerFilterChange(ids[0] ?? 'all')}
                      singleSelect
                      toolbar
                      placeholder={`All ${terms.runir}`}
                      initialPath={['Provisions']}
                    />
                  </FilterPaletteField>
                </FilterPaletteStack>
              ) : undefined
            }
          />
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
          <ToolbarTooltip label={`Provisions ${terms.laufar}`}>
            <button
              type="button"
              onClick={onManageLaufar}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Manage Provisions ${terms.laufar}`}
            >
              <LaufarIcon className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        </div>
      </div>
    </div>
  )
}

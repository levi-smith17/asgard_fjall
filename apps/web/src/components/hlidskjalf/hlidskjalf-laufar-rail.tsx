import { Bookmark, Settings, SlidersHorizontal } from 'lucide-react'
import type { CairnMarkerView, CairnTrailView, CairnWaypointView } from '@/lib/cairn-types'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { FilterInput } from '@/components/core/ui/filter-input'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { MarkerColorSwatch } from '@/components/cairn/markers-list'
import { ToolbarDropdown } from '@/components/core/ui/toolbar-dropdown'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { secureRemoteAssetUrl } from '@/lib/cairn-format'
import { cn } from '@/lib/utils'

export const LAUFAR_FILTER_ALL = '__all__'
export const LAUFAR_UNASSIGNED_GREIN = '__unassigned__'

export function HlidskjalfLaufarRailSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-3">
        <div className="flex h-14 min-h-14 max-h-14 items-center">
          <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="space-y-2 p-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-10 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
    </div>
  )
}

export function HlidskjalfLaufarRail({
  groups,
  selectedId,
  filterQuery,
  onFilterQueryChange,
  greinFilterId,
  onGreinFilterChange,
  runirFilterId,
  onRunirFilterChange,
  trails,
  markers,
  onInspect,
  onOpenUrl,
  onOpenCatalog,
  isLoading,
  unavailableMessage,
}: {
  groups: Array<{ label: string; waypoints: CairnWaypointView[] }>
  selectedId: string | null
  filterQuery: string
  onFilterQueryChange: (value: string) => void
  greinFilterId: string
  onGreinFilterChange: (id: string) => void
  runirFilterId: string
  onRunirFilterChange: (id: string) => void
  trails: CairnTrailView[]
  markers: CairnMarkerView[]
  onInspect: (id: string) => void
  onOpenUrl: (url: string) => void
  onOpenCatalog: () => void
  isLoading?: boolean
  unavailableMessage?: string | null
}) {
  const terms = useTerms()
  const greinOptions = [
    { id: LAUFAR_FILTER_ALL, label: terms.greinar },
    { id: LAUFAR_UNASSIGNED_GREIN, label: terms.unassigned },
    ...trails.map((trail) => ({ id: trail.id, label: trail.name })),
  ]

  const rawMarkers = markers.map((marker) => ({
    id: marker.id,
    name: marker.name,
    color: marker.color,
    icon: marker.icon,
  }))

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={Bookmark}>{terms.laufar}</StudioRailTitle>
        <ToolbarTooltip label={`${terms.greinar} & ${terms.runir}`}>
          <button
            type="button"
            className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
            onClick={onOpenCatalog}
            aria-label={`${terms.greinar} & ${terms.runir}`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden />
          </button>
        </ToolbarTooltip>
      </div>
      <div className="shrink-0 space-y-1.5 border-b border-border px-3 py-2">
        <FilterInput
          value={filterQuery}
          onChange={onFilterQueryChange}
          placeholder={`Filter ${terms.laufar.toLowerCase()}…`}
        />
        <div className="flex gap-1">
          <ToolbarDropdown
            value={greinFilterId}
            options={greinOptions}
            onChange={onGreinFilterChange}
            className="min-w-0 flex-1"
            fullWidth
            ariaLabel={terms.greinar}
          />
          <div className="min-w-0 flex-1">
            <MarkerPicker
              markers={rawMarkers}
              selected={runirFilterId !== LAUFAR_FILTER_ALL ? [runirFilterId] : []}
              onChange={(ids) => onRunirFilterChange(ids[0] ?? LAUFAR_FILTER_ALL)}
              placeholder={terms.runir}
              singleSelect
              toolbar
            />
          </div>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-9 animate-pulse rounded-md bg-muted" />
            ))}
          </div>
        ) : unavailableMessage ? (
          <p className="px-3 py-4 text-xs leading-relaxed text-muted-foreground">{unavailableMessage}</p>
        ) : groups.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No {terms.laufar.toLowerCase()} match.</p>
        ) : (
          groups.map((group) => (
            <section key={group.label}>
              <h3 className="sticky top-0 z-10 border-b border-border/60 bg-column-rail px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-1.5 p-2">
                {group.waypoints.map((waypoint) => (
                  <li key={waypoint.id}>
                    <div
                      className={cn(
                        'group flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
                        selectedId === waypoint.id
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border hover:border-primary/50',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onOpenUrl(waypoint.url)}
                        className="flex min-w-0 flex-1 items-start gap-2 text-left"
                      >
                        {waypoint.favicon ? (
                          <img
                            src={secureRemoteAssetUrl(waypoint.favicon)}
                            alt=""
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm"
                          />
                        ) : (
                          <span className="mt-0.5 h-3.5 w-3.5 shrink-0 rounded-sm bg-muted" aria-hidden />
                        )}
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">
                            {waypoint.title || waypoint.url}
                          </span>
                          {waypoint.markers.length > 0 ? (
                            <span className="mt-0.5 flex flex-wrap gap-0.5">
                              {waypoint.markers.slice(0, 2).map((marker) => (
                                <span
                                  key={marker.id}
                                  className="inline-flex items-center gap-0.5 rounded-full bg-muted px-1 py-0.5 text-[9px]"
                                >
                                  <MarkerColorSwatch color={marker.color} />
                                  {marker.name.split('/').pop()}
                                </span>
                              ))}
                            </span>
                          ) : null}
                        </span>
                      </button>
                      <ToolbarTooltip label={`Edit ${terms.laufarSingular.toLowerCase()}`}>
                        <button
                          type="button"
                          onClick={() => onInspect(waypoint.id)}
                          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                          aria-label={`Edit ${terms.laufarSingular.toLowerCase()}`}
                        >
                          <Settings className="h-3.5 w-3.5" />
                        </button>
                      </ToolbarTooltip>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

import {
  BookOpen,
  NotebookPen,
  Plus,
  Settings,
  SlidersHorizontal,
  StickyNote,
} from 'lucide-react'
import { MarkerPicker } from '@/components/apps/marker-picker'
import { MarkerColorSwatch } from '@/components/apps/markers-list'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { ToolbarDropdown } from '@/components/core/ui/toolbar-dropdown'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export const SOGUR_FILTER_ALL = '__all__'
export const SOGUR_FILTER_UNASSIGNED = '__unassigned__'

export type SogurRailMarker = {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type SogurRailItem = {
  id: string
  kind: 'saga' | 'thattr'
  name: string
  trailId: string | null
  trailName: string | null
  markers: SogurRailMarker[]
  preview?: string | null
  firstThattrId?: string | null
  sagaName?: string | null
}

export function SogurRail({
  items,
  nestedThaettir,
  selectedSagaId,
  selectedThattrId,
  filterQuery,
  onFilterQueryChange,
  greinFilterId,
  onGreinFilterChange,
  runirFilterId,
  onRunirFilterChange,
  greinar,
  runir,
  onOpenItem,
  onOpenFirstThattr,
  onInspectItem,
  onNewSaga,
  onOpenCatalog,
}: {
  /** Sagas and standalone Thaettir shown before filtering. */
  items: SogurRailItem[]
  /** Saga-owned Thaettir included when any rail filter is active. */
  nestedThaettir: SogurRailItem[]
  selectedSagaId: string | null
  selectedThattrId: string | null
  filterQuery: string
  onFilterQueryChange: (value: string) => void
  greinFilterId: string
  onGreinFilterChange: (id: string) => void
  runirFilterId: string
  onRunirFilterChange: (id: string) => void
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailMarker[]
  onOpenItem: (item: SogurRailItem) => void
  onOpenFirstThattr: (sagaId: string, thattrId: string) => void
  onInspectItem: (item: SogurRailItem) => void
  onNewSaga: () => void
  onOpenCatalog: () => void
}) {
  const terms = useTerms()
  const filtersActive =
    filterQuery.trim().length > 0 ||
    greinFilterId !== SOGUR_FILTER_ALL ||
    runirFilterId !== SOGUR_FILTER_ALL
  const query = filterQuery.trim().toLowerCase()
  const source = filtersActive ? [...items, ...nestedThaettir] : items
  const filtered = source.filter((item) => {
    if (
      greinFilterId !== SOGUR_FILTER_ALL &&
      (greinFilterId === SOGUR_FILTER_UNASSIGNED
        ? item.trailId != null
        : item.trailId !== greinFilterId)
    ) {
      return false
    }
    if (
      runirFilterId !== SOGUR_FILTER_ALL &&
      !item.markers.some((marker) => marker.id === runirFilterId)
    ) {
      return false
    }
    if (!query) return true
    return [
      item.name,
      item.preview ?? '',
      item.trailName ?? '',
      item.sagaName ?? '',
      ...item.markers.map((marker) => marker.name),
    ].some((value) => value.toLowerCase().includes(query))
  })

  const groups = new Map<string, SogurRailItem[]>()
  for (const item of filtered) {
    const key = item.trailName || terms.unassigned
    const bucket = groups.get(key)
    if (bucket) bucket.push(item)
    else groups.set(key, [item])
  }
  const groupedItems = [...groups.entries()]
    .sort(([left], [right]) => {
      if (left === terms.unassigned) return 1
      if (right === terms.unassigned) return -1
      return left.localeCompare(right)
    })
    .map(([label, groupItems]) => ({
      label,
      items: groupItems.sort((left, right) => left.name.localeCompare(right.name)),
    }))
  const greinOptions = [
    { id: SOGUR_FILTER_ALL, label: terms.greinar },
    { id: SOGUR_FILTER_UNASSIGNED, label: terms.unassigned },
    ...greinar.map((grein) => ({ id: grein.id, label: grein.name })),
  ]

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={NotebookPen}>{terms.notes}</StudioRailTitle>
        <div className="flex items-center gap-1">
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
          <ToolbarTooltip label={`Add ${terms.notesSingular}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onNewSaga}
              aria-label={`Add ${terms.notesSingular}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
      </div>

      <div className="shrink-0 space-y-1.5 border-b border-border px-3 py-2">
        <FilterInput
          value={filterQuery}
          onChange={onFilterQueryChange}
          placeholder={`Filter ${terms.notes.toLowerCase()} & ${terms.thaettir.toLowerCase()}…`}
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
              markers={runir}
              selected={runirFilterId !== SOGUR_FILTER_ALL ? [runirFilterId] : []}
              onChange={(ids) => onRunirFilterChange(ids[0] ?? SOGUR_FILTER_ALL)}
              placeholder={terms.runir}
              singleSelect
              toolbar
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {groupedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {filtersActive
                ? `No ${terms.notes.toLowerCase()} or ${terms.thaettir.toLowerCase()} match.`
                : `No ${terms.notes.toLowerCase()} or ${terms.thaettir.toLowerCase()} yet.`}
            </p>
            {!filtersActive ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Use + to create a {terms.notesSingular.toLowerCase()}.
              </p>
            ) : null}
          </div>
        ) : (
          groupedItems.map((group) => (
            <section key={group.label}>
              <h3 className="sticky top-0 z-10 border-b border-border/60 bg-column-rail px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {group.label}
              </h3>
              <ul className="space-y-1.5 p-2">
                {group.items.map((item) => {
                  const selected =
                    item.kind === 'saga'
                      ? selectedSagaId === item.id && !selectedThattrId
                      : selectedThattrId === item.id
                  const Icon = item.kind === 'saga' ? NotebookPen : StickyNote
                  return (
                    <li key={`${item.kind}:${item.id}`}>
                      <div
                        className={cn(
                          'group flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
                          selected
                            ? 'border-primary/40 bg-primary/10'
                            : 'border-border hover:border-primary/50',
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => onOpenItem(item)}
                          className="flex min-w-0 flex-1 items-start gap-2 text-left"
                        >
                          <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-medium">{item.name}</span>
                            {item.kind === 'thattr' && item.sagaName ? (
                              <span className="block truncate text-[10px] text-muted-foreground">
                                {item.sagaName}
                              </span>
                            ) : null}
                            {item.preview ? (
                              <span className="mt-0.5 line-clamp-2 block text-[10px] leading-snug text-muted-foreground">
                                {item.preview}
                              </span>
                            ) : null}
                            {item.markers.length > 0 ? (
                              <span className="mt-1 flex flex-wrap gap-0.5">
                                {item.markers.slice(0, 3).map((marker) => (
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
                        <div className="flex shrink-0 items-center gap-0.5">
                          {item.kind === 'saga' && item.firstThattrId ? (
                            <ToolbarTooltip label={`Open first ${terms.thattrSingular.toLowerCase()}`}>
                              <button
                                type="button"
                                onClick={() => onOpenFirstThattr(item.id, item.firstThattrId!)}
                                className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                                aria-label={`Open first ${terms.thattrSingular.toLowerCase()}`}
                              >
                                <BookOpen className="h-3.5 w-3.5" aria-hidden />
                              </button>
                            </ToolbarTooltip>
                          ) : null}
                          <ToolbarTooltip
                            label={`Edit ${
                              item.kind === 'saga'
                                ? terms.notesSingular.toLowerCase()
                                : terms.thattrSingular.toLowerCase()
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onInspectItem(item)}
                              className="rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                              aria-label={`Edit ${item.name}`}
                            >
                              <Settings className="h-3.5 w-3.5" aria-hidden />
                            </button>
                          </ToolbarTooltip>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </section>
          ))
        )}
      </div>
    </div>
  )
}

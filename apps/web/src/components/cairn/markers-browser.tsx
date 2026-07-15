import { useMemo } from 'react'
import { ChevronLeft, Plus, Settings, Tag } from 'lucide-react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  buildMarkerTree,
  getAllLeafIds,
  getAllLeaves,
  getNodesAtPath,
} from '@/lib/marker-groups'
import { cn } from '@/lib/utils'

export type MarkerParentContext = {
  name: string
  color: string
  icon: string | null
}

export function MarkersBrowser({
  markers,
  search,
  onSearchChange,
  groupPath,
  selectedId,
  onSelect,
  onNew,
  onNewSubmarker,
  onNavigateInto,
  rootPath = [],
}: {
  markers: CairnMarkerView[]
  search: string
  onSearchChange?: (value: string) => void
  groupPath: string[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
  onNewSubmarker: (parent: MarkerParentContext) => void
  onNavigateInto: (path: string[]) => void
  /** When set, navigation cannot go above this path (e.g. `['Provisions']`). */
  rootPath?: string[]
}) {
  const tree = useMemo(() => buildMarkerTree(markers), [markers])
  const markerMap = useMemo(() => new Map(markers.map((marker) => [marker.id, marker])), [markers])
  const currentNodes = useMemo(() => getNodesAtPath(tree, groupPath), [tree, groupPath])
  const allLeaves = useMemo(() => getAllLeaves(tree), [tree])
  const canGoBack = groupPath.length > rootPath.length
  const atRoot = rootPath.length > 0 && groupPath.length === rootPath.length

  const isSearching = search.trim().length > 0
  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const query = search.toLowerCase()
    const rootPrefix = rootPath.length > 0 ? `${rootPath.join('/')}/` : null
    const rootName = rootPath.length > 0 ? rootPath.join('/') : null
    return allLeaves
      .map(({ leaf }) => markerMap.get(leaf.id))
      .filter((marker): marker is CairnMarkerView => {
        if (!marker || !marker.name.toLowerCase().includes(query)) return false
        if (!rootName) return true
        return marker.name === rootName || marker.name.startsWith(rootPrefix!)
      })
  }, [allLeaves, markerMap, search, isSearching, rootPath])

  const currentGroupMarker =
    groupPath.length > 0 ? markers.find((marker) => marker.name === groupPath.join('/')) ?? null : null
  const groupMarkerCount = useMemo(() => getAllLeafIds(currentNodes).length, [currentNodes])

  const countLabel = isSearching
    ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}`
    : groupPath.length === 0
      ? `${markers.length} total`
      : `${groupMarkerCount} total in ${groupPath[groupPath.length - 1]}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          {canGoBack ? (
            <ToolbarTooltip
              label={`Back to ${
                groupPath.length === rootPath.length + 1
                  ? (groupPath[groupPath.length - 2] ?? rootPath[rootPath.length - 1])
                  : groupPath[groupPath.length - 2]
              }`}
            >
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => onNavigateInto(groupPath.slice(0, -1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </ToolbarTooltip>
          ) : null}
          <span className="flex-1 text-xs text-muted-foreground">{countLabel}</span>
          <ToolbarTooltip
            label={
              groupPath.length === 0 && rootPath.length === 0
                ? 'Add marker'
                : `Add sub-marker in ${groupPath[groupPath.length - 1] ?? rootPath[rootPath.length - 1]}`
            }
          >
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => {
                if (groupPath.length === 0 && rootPath.length === 0) {
                  onNew()
                  return
                }
                const path = groupPath.length > 0 ? groupPath : rootPath
                onNewSubmarker({
                  name: path.join('/'),
                  color: currentGroupMarker?.color ?? '#6b7280',
                  icon: currentGroupMarker?.icon ?? null,
                })
              }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </ToolbarTooltip>
        </div>
        {onSearchChange ? (
          <div className="border-b border-border px-3 py-2">
            <FilterInput value={search} onChange={onSearchChange} />
          </div>
        ) : null}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {markers.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <Tag className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">No markers yet.</p>
            <button type="button" onClick={onNew} className="mt-1 text-sm text-primary hover:underline">
              Create your first marker
            </button>
          </div>
        ) : isSearching ? (
          searchResults.length === 0 ? (
            <p className="py-8 text-center text-xs text-muted-foreground">No results</p>
          ) : (
            searchResults.map((marker) => (
              <SearchResultRow
                key={marker.id}
                marker={marker}
                isSelected={selectedId === marker.id}
                onSelect={() => onSelect(marker.id)}
                onAdd={() =>
                  onNewSubmarker({ name: marker.name, color: marker.color, icon: marker.icon })
                }
              />
            ))
          )
        ) : currentNodes.length === 0 && !(atRoot && currentGroupMarker) ? (
          <div className="flex h-full flex-col items-center justify-center px-4 py-16 text-center">
            <p className="text-sm text-muted-foreground">No markers in this group.</p>
            <button
              type="button"
              onClick={() =>
                onNewSubmarker({ name: groupPath.join('/'), color: '#6b7280', icon: null })
              }
              className="mt-1 text-sm text-primary hover:underline"
            >
              Add one
            </button>
          </div>
        ) : (
          <>
          {atRoot && currentGroupMarker ? (
            <MarkerRow
              key={`root-${currentGroupMarker.id}`}
              label={currentGroupMarker.name.split('/').pop() ?? currentGroupMarker.name}
              color={currentGroupMarker.color}
              isSelected={selectedId === currentGroupMarker.id}
              canDrill={false}
              onOpen={() => onSelect(currentGroupMarker.id)}
              onEdit={() => onSelect(currentGroupMarker.id)}
              onAdd={() =>
                onNewSubmarker({
                  name: currentGroupMarker.name,
                  color: currentGroupMarker.color,
                  icon: currentGroupMarker.icon ?? null,
                })
              }
            />
          ) : null}
          {currentNodes.map((node) => {
            const currentPath = [...groupPath, node.label]
            if (node.type === 'group') {
              if (node.id) {
                return (
                  <MarkerRow
                    key={node.id}
                    label={node.label}
                    color={node.color!}
                    isSelected={selectedId === node.id}
                    canDrill
                    onOpen={() => onNavigateInto(currentPath)}
                    onEdit={() => onSelect(node.id!)}
                    onAdd={() =>
                      onNewSubmarker({
                        name: currentPath.join('/'),
                        color: node.color!,
                        icon: node.icon ?? null,
                      })
                    }
                  />
                )
              }
              return (
                <GroupRow
                  key={node.label}
                  label={node.label}
                  onOpen={() => onNavigateInto(currentPath)}
                  onAdd={() =>
                    onNewSubmarker({ name: currentPath.join('/'), color: '#6b7280', icon: null })
                  }
                />
              )
            }
            return (
              <MarkerRow
                key={node.id}
                label={node.label}
                color={node.color}
                isSelected={selectedId === node.id}
                canDrill={false}
                onOpen={() => onSelect(node.id)}
                onEdit={() => onSelect(node.id)}
                onAdd={() =>
                  onNewSubmarker({ name: node.name, color: node.color, icon: node.icon ?? null })
                }
              />
            )
          })}
          </>
        )}
      </div>
    </div>
  )
}

function MarkerRow({
  label,
  color,
  isSelected,
  canDrill,
  onOpen,
  onEdit,
  onAdd,
}: {
  label: string
  color: string
  isSelected: boolean
  canDrill: boolean
  onOpen: () => void
  onEdit: () => void
  onAdd: () => void
}) {
  return (
    <div
      className={cn(
        'group flex items-center gap-2 border-b border-border px-4 py-2.5 transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50',
      )}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <button
        type="button"
        onClick={onOpen}
        className={cn(
          'min-w-0 flex-1 truncate text-left text-sm',
          canDrill && 'font-medium',
        )}
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label="Add sub-marker"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <ToolbarTooltip label="Edit">
        <button
          type="button"
          onClick={onEdit}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Edit ${label}`}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </ToolbarTooltip>
    </div>
  )
}

function GroupRow({
  label,
  onOpen,
  onAdd,
}: {
  label: string
  onOpen: () => void
  onAdd: () => void
}) {
  return (
    <div className="group flex items-center gap-2 border-b border-border px-4 py-2.5 transition-colors hover:bg-muted/50">
      <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground/30" />
      <button
        type="button"
        onClick={onOpen}
        className="min-w-0 flex-1 truncate text-left text-sm font-medium"
      >
        {label}
      </button>
      <button
        type="button"
        onClick={onAdd}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label="Add sub-marker"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}

function SearchResultRow({
  marker,
  isSelected,
  onSelect,
  onAdd,
}: {
  marker: CairnMarkerView
  isSelected: boolean
  onSelect: () => void
  onAdd: () => void
}) {
  const segments = marker.name.split('/')
  const label = segments[segments.length - 1]
  const parentPath = segments.slice(0, -1).join(' / ')

  return (
    <div
      className={cn(
        'group flex items-center gap-2 border-b border-border px-4 py-2.5 transition-colors',
        isSelected ? 'bg-primary/10' : 'hover:bg-muted/50 cursor-pointer',
      )}
      onClick={onSelect}
    >
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: marker.color }} />
      <div className="min-w-0 flex-1">
        {parentPath ? <p className="truncate text-[10px] text-muted-foreground/60">{parentPath}</p> : null}
        <p className="truncate text-sm">{label}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          onAdd()
        }}
        className="shrink-0 rounded p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
        aria-label="Add sub-marker"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <ToolbarTooltip label="Edit">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onSelect()
          }}
          className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label={`Edit ${label}`}
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </ToolbarTooltip>
    </div>
  )
}

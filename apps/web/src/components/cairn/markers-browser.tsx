import { useMemo } from 'react'
import { ChevronLeft, ChevronRight, Plus, Tag } from 'lucide-react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { buildMarkerTree, getAllLeafIds, getAllLeaves, getNodesAtPath } from '@/lib/marker-groups'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export type MarkerParentContext = { name: string; color: string; icon: string | null }

export function MarkersBrowser({
  markers, search, onSearchChange, groupPath, selectedId, onSelect, onNew, onNewSubmarker, onNavigateInto,
}: {
  markers: CairnMarkerView[]; search: string; onSearchChange?: (v: string) => void; groupPath: string[]; selectedId: string | null; onSelect: (id: string) => void; onNew: () => void; onNewSubmarker: (parent: MarkerParentContext) => void; onNavigateInto: (path: string[]) => void
}) {
  const terms = useTerms()
  const tree = useMemo(() => buildMarkerTree(markers), [markers])
  const markerMap = useMemo(() => new Map(markers.map((m) => [m.id, m])), [markers])
  const currentNodes = useMemo(() => getNodesAtPath(tree, groupPath), [tree, groupPath])
  const allLeaves = useMemo(() => getAllLeaves(tree), [tree])

  const isSearching = search.trim().length > 0
  const searchResults = useMemo(() => {
    if (!isSearching) return []
    const query = search.toLowerCase()
    return allLeaves.map(({ leaf }) => markerMap.get(leaf.id)).filter((m): m is CairnMarkerView => !!m && m.name.toLowerCase().includes(query))
  }, [allLeaves, markerMap, search, isSearching])

  const currentGroupMarker = groupPath.length > 0 ? markers.find((m) => m.name === groupPath.join('/')) ?? null : null
  const groupMarkerCount = useMemo(() => getAllLeafIds(currentNodes).length, [currentNodes])
  const countLabel = isSearching ? `${searchResults.length} result${searchResults.length === 1 ? '' : 's'}` : groupPath.length === 0 ? `${markers.length} total` : `${groupMarkerCount} total in ${groupPath[groupPath.length - 1]}`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0">
        <div className="flex items-center gap-2 border-b border-border px-4 py-2">
          {groupPath.length > 0 ? (
            <ToolbarTooltip label={`Back to ${groupPath.length === 1 ? `all ${terms.runir.toLowerCase()}` : groupPath[groupPath.length - 2]}`}>
              <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => onNavigateInto(groupPath.slice(0, -1))}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
            </ToolbarTooltip>
          ) : null}
          <span className="min-w-0 flex-1 truncate text-xs font-medium text-muted-foreground">
            {groupPath.length > 0 ? groupPath.join(' / ') : `All ${terms.runir.toLowerCase()}`}
          </span>
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{countLabel}</span>
          <ToolbarTooltip label={currentGroupMarker ? `Add sub-${terms.runSingular.toLowerCase()} to ${currentGroupMarker.name}` : `New ${terms.runSingular.toLowerCase()}`}>
            <Button type="button" size="icon" variant="secondary" className="h-7 w-7 shrink-0" onClick={() => {
              if (currentGroupMarker) onNewSubmarker({ name: currentGroupMarker.name, color: currentGroupMarker.color, icon: currentGroupMarker.icon })
              else onNew()
            }} aria-label={`New ${terms.runSingular.toLowerCase()}`}>
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
        {onSearchChange ? (
          <div className="border-b border-border px-3 py-2">
            <FilterInput value={search} onChange={onSearchChange} placeholder={`Filter ${terms.runir.toLowerCase()}…`} />
          </div>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto py-1">
        {isSearching ? (
          searchResults.length === 0 ? <p className="px-3 py-4 text-xs text-muted-foreground">No matches.</p> : (
            searchResults.map((marker) => (
              <button key={marker.id} type="button" onClick={() => onSelect(marker.id)} className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted-hover', selectedId === marker.id && 'bg-primary/10 text-primary')}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: marker.color }} />
                <span className="min-w-0 flex-1 truncate">{marker.name}</span>
              </button>
            ))
          )
        ) : currentNodes.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <Tag className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-xs text-muted-foreground">No {terms.runir.toLowerCase()} yet</p>
          </div>
        ) : (
          currentNodes.map((node) =>
            node.type === 'group' ? (
              <div key={node.label} className="flex w-full items-center text-xs transition-colors hover:bg-muted/60">
                {node.id ? (
                  <button type="button" onClick={() => onSelect(node.id!)} className={cn('flex shrink-0 items-center gap-1.5 py-1.5 pl-3 pr-2', selectedId === node.id && 'text-primary')}>
                    <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: node.color }} />
                  </button>
                ) : null}
                <button type="button" onClick={() => onNavigateInto([...groupPath, node.label])} className={cn('flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-3 text-left', !node.id && 'pl-3')}>
                  <span className="flex-1 truncate font-medium">{node.label}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">{getAllLeafIds(node.children).length}</span>
                  <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
              </div>
            ) : (
              <button key={node.id} type="button" onClick={() => onSelect(node.id)} className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-xs transition-colors hover:bg-muted-hover', selectedId === node.id && 'bg-primary/10 text-primary')}>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: node.color }} />
                <span className="min-w-0 flex-1 truncate">{node.label}</span>
              </button>
            )
          )
        )}
      </div>
    </div>
  )
}

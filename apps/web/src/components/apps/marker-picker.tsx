import { useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ArrowLeft, Check, ChevronRight, Search, Tag } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { cn } from '@/lib/utils'
import {
  buildMarkerTree,
  getAllLeafIds,
  getAllLeaves,
  getNodesAtPath,
  type FlatLeaf,
  type MarkerGroup,
  type RawMarker,
} from '@/lib/marker-groups'

type MarkerPickerProps = {
  markers: RawMarker[]
  selected: string[]
  onChange: (ids: string[]) => void
  placeholder?: string
  compact?: boolean
  toolbar?: boolean
  inline?: boolean
  singleSelect?: boolean
  initialPath?: string[]
  triggerClassName?: string
}

export function MarkerPicker({
  markers,
  selected,
  onChange,
  placeholder = 'Markers',
  compact = false,
  toolbar = false,
  inline = false,
  singleSelect = false,
  initialPath,
  triggerClassName,
}: MarkerPickerProps) {
  const [open, setOpen] = useState(false)
  const [path, setPath] = useState<string[]>(initialPath ?? [])
  const [search, setSearch] = useState('')
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const [panelStyle, setPanelStyle] = useState<{ top: number; left: number; width: number } | null>(
    null,
  )
  const usePortal = toolbar || compact

  const tree = useMemo(() => buildMarkerTree(markers), [markers])
  const allLeaves = useMemo(() => getAllLeaves(tree), [tree])
  const currentNodes = useMemo(() => getNodesAtPath(tree, path), [tree, path])

  const searchResults = useMemo<FlatLeaf[]>(() => {
    if (!search.trim()) return []
    const query = search.toLowerCase()
    return allLeaves.filter(
      ({ leaf, path: leafPath }) =>
        leaf.label.toLowerCase().includes(query) ||
        leafPath.join('/').toLowerCase().includes(query) ||
        leaf.name.toLowerCase().includes(query),
    )
  }, [allLeaves, search])

  const isSearching = search.trim().length > 0
  const currentGroupLeafIds = useMemo(() => getAllLeafIds(currentNodes), [currentNodes])
  const allInGroupSelected =
    currentGroupLeafIds.length > 0 && currentGroupLeafIds.every((id) => selected.includes(id))
  const someInGroupSelected = currentGroupLeafIds.some((id) => selected.includes(id))

  useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => {
      const target = event.target as Node
      if (rootRef.current?.contains(target) || panelRef.current?.contains(target)) return
      handleOpenChange(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  useEffect(() => {
    if (!open || !usePortal) {
      setPanelStyle(null)
      return
    }
    function positionPanel() {
      const trigger = triggerRef.current
      if (!trigger) return
      const rect = trigger.getBoundingClientRect()
      setPanelStyle({
        top: rect.bottom + 4,
        left: rect.left,
        width: Math.max(rect.width, 224),
      })
    }
    positionPanel()
    window.addEventListener('resize', positionPanel)
    window.addEventListener('scroll', positionPanel, true)
    return () => {
      window.removeEventListener('resize', positionPanel)
      window.removeEventListener('scroll', positionPanel, true)
    }
  }, [open, usePortal])

  useEffect(() => {
    if (open) setTimeout(() => searchRef.current?.focus(), 50)
  }, [open])

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      setTimeout(() => {
        setPath(initialPath ?? [])
        setSearch('')
      }, 150)
    }
  }

  function toggleId(id: string) {
    if (singleSelect) {
      onChange(selected.includes(id) ? [] : [id])
      handleOpenChange(false)
      return
    }
    onChange(selected.includes(id) ? selected.filter((value) => value !== id) : [...selected, id])
  }

  function toggleGroup() {
    if (allInGroupSelected) {
      onChange(selected.filter((id) => !currentGroupLeafIds.includes(id)))
      return
    }
    onChange(Array.from(new Set([...selected, ...currentGroupLeafIds])))
  }

  const selectedMarkers = markers.filter((marker) => selected.includes(marker.id))
  const triggerContent =
    selectedMarkers.length === 0 ? (
      <span className={toolbar ? 'text-foreground' : 'text-muted-foreground'}>{placeholder}</span>
    ) : singleSelect ? (
      <span className="flex min-w-0 items-center gap-1.5">
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full"
          style={{ backgroundColor: selectedMarkers[0].color }}
        />
        <span className="truncate">{selectedMarkers[0].name.split('/').pop()}</span>
      </span>
    ) : (
      <span className="flex min-w-0 items-center gap-1.5">
        <span className="flex shrink-0 items-center gap-0.5">
          {selectedMarkers.slice(0, 5).map((marker) => (
            <span
              key={marker.id}
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: marker.color }}
            />
          ))}
        </span>
        <span className="truncate">
          {selectedMarkers.length <= 5
            ? selectedMarkers.map((marker) => marker.name.split('/').pop()).join(', ')
            : `${selectedMarkers.length} selected`}
        </span>
      </span>
    )

  const panelClassName = cn(
    'z-[200] overflow-hidden rounded-md border border-border bg-card shadow-lg',
    usePortal ? 'fixed' : 'absolute inset-x-0 top-full mt-1',
  )

  const panel = (
    <MarkerPickerPanel
      panelRef={panelRef}
      searchRef={searchRef}
      search={search}
      setSearch={setSearch}
      isSearching={isSearching}
      path={path}
      setPath={setPath}
      currentNodes={currentNodes}
      currentGroupLeafIds={currentGroupLeafIds}
      allInGroupSelected={allInGroupSelected}
      someInGroupSelected={someInGroupSelected}
      toggleGroup={toggleGroup}
      searchResults={searchResults}
      selected={selected}
      toggleId={toggleId}
      singleSelect={singleSelect}
      onChange={onChange}
      className={panelClassName}
      style={usePortal && panelStyle ? panelStyle : undefined}
    />
  )

  return (
    <div ref={rootRef} className={cn('relative', inline ? 'shrink-0' : 'w-full')}>
      {compact || toolbar ? (
        <button
          ref={triggerRef}
          type="button"
          onClick={() => handleOpenChange(!open)}
          className={cn(
            'flex min-w-[72px] items-center gap-1.5 px-2.5 text-xs font-medium transition-colors',
            inline ? 'w-auto' : 'w-full',
            toolbar
              ? cn(
                  'h-8 rounded-md border border-border bg-input text-foreground hover:bg-muted-hover',
                  triggerClassName,
                )
              : 'rounded border border-dashed border-border py-1 text-muted-foreground hover:bg-muted/50',
          )}
        >
          <span className="min-w-0 flex-1 truncate text-left">{triggerContent}</span>
          <ChevronRight className={cn('h-2.5 w-2.5 shrink-0 rotate-90', toolbar && 'h-3 w-3 opacity-70')} />
        </button>
      ) : (
        <Button
          ref={triggerRef}
          type="button"
          variant="outline"
          size="sm"
          className="h-9 w-full justify-start gap-1.5 border-border bg-input text-sm hover:bg-muted/30"
          onClick={() => handleOpenChange(!open)}
        >
          <Tag className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="flex min-w-0 flex-1 items-center gap-1.5 truncate">{triggerContent}</span>
          <ChevronRight className="h-3 w-3 shrink-0 rotate-90 text-muted-foreground" />
        </Button>
      )}

      {open && !usePortal ? panel : null}
      {open && usePortal && panelStyle ? createPortal(panel, document.body) : null}
    </div>
  )
}

function MarkerPickerPanel({
  panelRef,
  searchRef,
  search,
  setSearch,
  isSearching,
  path,
  setPath,
  currentNodes,
  currentGroupLeafIds,
  allInGroupSelected,
  someInGroupSelected,
  toggleGroup,
  searchResults,
  selected,
  toggleId,
  singleSelect,
  onChange,
  className,
  style,
}: {
  panelRef: React.RefObject<HTMLDivElement | null>
  searchRef: React.RefObject<HTMLInputElement | null>
  search: string
  setSearch: (value: string) => void
  isSearching: boolean
  path: string[]
  setPath: React.Dispatch<React.SetStateAction<string[]>>
  currentNodes: ReturnType<typeof getNodesAtPath>
  currentGroupLeafIds: string[]
  allInGroupSelected: boolean
  someInGroupSelected: boolean
  toggleGroup: () => void
  searchResults: FlatLeaf[]
  selected: string[]
  toggleId: (id: string) => void
  singleSelect: boolean
  onChange: (ids: string[]) => void
  className?: string
  style?: React.CSSProperties
}) {
  return (
    <div ref={panelRef} className={className} style={style} data-studio-portal>
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <input
          ref={searchRef}
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search…"
          className="flex-1 bg-transparent text-xs outline-none placeholder:text-muted-foreground"
        />
        {search ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-6 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => setSearch('')}
          >
            Clear
          </Button>
        ) : null}
      </div>

      {!isSearching && path.length > 0 ? (
        <div className="flex items-center gap-1 border-b border-border bg-muted/30 px-3 py-1.5 text-xs">
          <button
            type="button"
            onClick={() => setPath(path.slice(0, -1))}
            className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3 w-3" />
          </button>
          <div className="flex min-w-0 flex-wrap items-center gap-0.5">
            <button
              type="button"
              onClick={() => setPath([])}
              className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
            >
              All
            </button>
            {path.map((segment, index) => (
              <span key={`${segment}-${index}`} className="flex items-center gap-0.5">
                <ChevronRight className="h-2.5 w-2.5 text-muted-foreground/50" />
                <button
                  type="button"
                  onClick={() => setPath(path.slice(0, index + 1))}
                  className={
                    index === path.length - 1
                      ? 'font-medium text-foreground'
                      : 'text-muted-foreground transition-colors hover:text-foreground'
                  }
                >
                  {segment}
                </button>
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="max-h-64 overflow-y-auto py-1">
        {isSearching ? (
          searchResults.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted-foreground">No results</p>
          ) : (
            searchResults.map(({ leaf, path: leafPath }) => (
              <LeafRow
                key={leaf.id}
                label={leafPath.join(' / ')}
                color={leaf.color}
                selected={selected.includes(leaf.id)}
                onToggle={() => toggleId(leaf.id)}
                singleSelect={singleSelect}
              />
            ))
          )
        ) : (
          <>
            {!singleSelect && path.length > 0 && currentGroupLeafIds.length > 0 ? (
              <>
                <button
                  type="button"
                  onClick={toggleGroup}
                  className="flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors hover:bg-muted/60"
                >
                  <PickerCheckbox
                    checked={allInGroupSelected}
                    indeterminate={!allInGroupSelected && someInGroupSelected}
                  />
                  <span className="font-medium">
                    {allInGroupSelected ? 'Deselect all' : 'Select all'} in {path[path.length - 1]}
                  </span>
                </button>
                <div className="mx-3 my-1 border-t border-border" />
              </>
            ) : null}

            {currentNodes.length === 0 ? (
              <p className="py-4 text-center text-xs text-muted-foreground">No markers</p>
            ) : (
              currentNodes.map((node) =>
                node.type === 'group' ? (
                  <GroupRow
                    key={node.label}
                    node={node}
                    selectedCount={getAllLeafIds(node.children).filter((id) => selected.includes(id)).length}
                    totalCount={getAllLeafIds(node.children).length}
                    onDrillIn={() => {
                      setSearch('')
                      setPath((current) => [...current, node.label])
                    }}
                    singleSelect={singleSelect}
                    markerSelected={node.id ? selected.includes(node.id) : false}
                    onToggleMarker={node.id ? () => toggleId(node.id!) : undefined}
                  />
                ) : (
                  <LeafRow
                    key={node.id}
                    label={node.label}
                    color={node.color}
                    selected={selected.includes(node.id)}
                    onToggle={() => toggleId(node.id)}
                    singleSelect={singleSelect}
                  />
                ),
              )
            )}
          </>
        )}
      </div>

      {selected.length > 0 ? (
        <div className="border-t border-border px-3 py-2">
          <button
            type="button"
            onClick={() => {
              onChange([])
            }}
            className="text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            {singleSelect ? 'Clear' : `Clear all (${selected.length} selected)`}
          </button>
        </div>
      ) : null}
    </div>
  )
}

function GroupRow({
  node,
  selectedCount,
  totalCount,
  onDrillIn,
  singleSelect,
  markerSelected,
  onToggleMarker,
}: {
  node: MarkerGroup
  selectedCount: number
  totalCount: number
  onDrillIn: () => void
  singleSelect: boolean
  markerSelected: boolean
  onToggleMarker?: () => void
}) {
  return (
    <div className="flex w-full items-center text-xs transition-colors hover:bg-muted/60">
      {node.id && onToggleMarker ? (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onToggleMarker()
          }}
          className="flex shrink-0 items-center gap-1.5 py-1.5 pl-3 pr-2"
          title={`Select "${node.label}"`}
        >
          {!singleSelect ? <PickerCheckbox checked={markerSelected} /> : null}
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: node.color }} />
        </button>
      ) : null}
      <button
        type="button"
        onClick={onDrillIn}
        className={cn('flex min-w-0 flex-1 items-center gap-2.5 py-1.5 pr-3 text-left', !node.id && 'pl-3')}
      >
        <span className="flex-1 truncate font-medium">{node.label}</span>
        {!singleSelect && selectedCount > 0 ? (
          <span className="shrink-0 text-[10px] tabular-nums text-muted-foreground">
            {selectedCount}/{totalCount}
          </span>
        ) : null}
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
      </button>
    </div>
  )
}

function LeafRow({
  label,
  color,
  selected,
  onToggle,
  singleSelect,
}: {
  label: string
  color: string
  selected: boolean
  onToggle: () => void
  singleSelect: boolean
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        'flex w-full items-center gap-2.5 px-3 py-1.5 text-left text-xs transition-colors',
        selected ? 'bg-muted/50' : 'hover:bg-muted/40',
      )}
    >
      {!singleSelect ? <PickerCheckbox checked={selected} /> : null}
      <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      <span className="flex-1 truncate">{label}</span>
      {selected ? <Check className="h-3 w-3 shrink-0 text-foreground/60" /> : null}
    </button>
  )
}

function PickerCheckbox({
  checked,
  indeterminate = false,
}: {
  checked: boolean
  indeterminate?: boolean
}) {
  return (
    <span
      className={cn(
        'flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border-2 transition-colors',
        checked || indeterminate ? 'border-primary bg-primary' : 'border-muted-foreground/40',
      )}
    >
      {indeterminate ? (
        <span className="block h-px w-1.5 bg-primary-foreground" />
      ) : checked ? (
        <Check className="h-2 w-2 text-primary-foreground" />
      ) : null}
    </span>
  )
}

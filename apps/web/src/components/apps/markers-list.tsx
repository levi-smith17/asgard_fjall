import { Plus } from 'lucide-react'
import type { CairnMarkerView } from '@/lib/data-types'
import { Button } from '@/components/core/ui/button'
import { AppPanelHeader } from '@/components/apps/split-canvas'
import { ASGARD_PRIMARY_HEX } from '@/lib/brand-colors'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#ef4444',
  '#f43f5e',
  '#f97316',
  '#fb923c',
  '#eab308',
  '#a3e635',
  ASGARD_PRIMARY_HEX,
  '#22c55e',
  '#16a34a',
  '#10b981',
  '#14b8a6',
  '#06b6d4',
  '#0ea5e9',
  '#3b82f6',
  '#6366f1',
  '#8b5cf6',
  '#a855f7',
  '#d946ef',
  '#ec4899',
  '#78716c',
  '#6b7280',
  '#334155',
  '#1e293b',
]

export function MarkerColorSwatch({
  color,
  className,
}: {
  color: string
  className?: string
}) {
  return (
    <span
      className={cn(
        'inline-block h-3 w-3 shrink-0 rounded-full border border-border/60',
        className,
      )}
      style={{ backgroundColor: color }}
      aria-hidden
    />
  )
}

export { PRESET_COLORS }

export function MarkersList({
  markers,
  selectedId,
  searchQuery,
  onSearchChange,
  onSelect,
  onNew,
}: {
  markers: CairnMarkerView[]
  selectedId: string | null
  searchQuery: string
  onSearchChange: (value: string) => void
  onSelect: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AppPanelHeader
        title="Markers"
        actions={
          <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={onNew} aria-label="New marker">
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        }
      />
      <div className="border-b border-border px-3 py-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search markers…"
          className="h-8 w-full rounded-md border border-border bg-input px-2.5 text-xs"
        />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {markers.length === 0 ? (
          <p className="px-4 py-6 text-sm text-muted-foreground">No markers match.</p>
        ) : (
          <ul>
            {markers.map((marker) => (
              <li key={marker.id}>
                <button
                  type="button"
                  onClick={() => onSelect(marker.id)}
                  className={cn(
                    'flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm transition-colors hover:bg-muted-hover',
                    selectedId === marker.id && 'bg-primary/10 text-primary',
                  )}
                >
                  <MarkerColorSwatch color={marker.color} />
                  <span className="min-w-0 flex-1 truncate font-medium">{marker.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">
                    {marker.waypointCount}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

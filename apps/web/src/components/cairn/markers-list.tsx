import { Plus } from 'lucide-react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { Button } from '@/components/core/ui/button'
import { CairnPanelHeader } from '@/components/cairn/cairn-split-canvas'
import { cn } from '@/lib/utils'

export const PRESET_COLORS = [
  '#ef4444', '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#8b5cf6', '#ec4899', '#6b7280',
]

export function MarkerColorSwatch({ color }: { color: string }) {
  return <span className="inline-block h-3 w-3 shrink-0 rounded-full border border-border/60" style={{ backgroundColor: color }} aria-hidden />
}

export function MarkersList({ markers, selectedId, searchQuery, onSearchChange, onSelect, onNew }: {
  markers: CairnMarkerView[]; selectedId: string | null; searchQuery: string; onSearchChange: (v: string) => void; onSelect: (id: string) => void; onNew: () => void
}) {
  const filtered = markers.filter((m) => m.name.toLowerCase().includes(searchQuery.toLowerCase()))
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <CairnPanelHeader title="Markers" actions={<Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={onNew} aria-label="New marker"><Plus className="h-3.5 w-3.5" aria-hidden /></Button>} />
      <div className="border-b border-border px-3 py-2">
        <input type="search" value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} placeholder="Filter markers…" className="h-8 w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground" />
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {filtered.map((marker) => (
          <button key={marker.id} type="button" onClick={() => onSelect(marker.id)} className={cn('flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors hover:bg-muted-hover', selectedId === marker.id && 'bg-primary/10 text-primary')}>
            <MarkerColorSwatch color={marker.color} />
            <span className="min-w-0 flex-1 truncate">{marker.name}</span>
          </button>
        ))}
      </div>
    </div>
  )
}

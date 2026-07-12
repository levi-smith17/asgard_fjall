import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { CairnMarkerView, CairnTrailView } from '@/lib/cairn-types'
import { MarkersBrowser, type MarkerParentContext } from '@/components/cairn/markers-browser'
import { MarkerInspector } from '@/components/cairn/marker-inspector'
import { TrailInspector } from '@/components/cairn/trail-inspector'
import { Button } from '@/components/core/ui/button'
import { ContextTabButton } from '@/components/core/ui/context-tab'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { createCairnMarker, createCairnTrail, deleteCairnMarker, deleteCairnTrail, updateCairnMarker, updateCairnTrail } from '@/lib/cairn-api'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export type CairnCatalogTab = 'greinar' | 'runir'

function CatalogTabBar({ active, onChange }: { active: CairnCatalogTab; onChange: (tab: CairnCatalogTab) => void }) {
  const terms = useTerms()
  return (
    <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Cairn catalog">
      <ContextTabButton active={active === 'greinar'} onClick={() => onChange('greinar')} className="flex-1 justify-center text-xs">{terms.greinar}</ContextTabButton>
      <ContextTabButton active={active === 'runir'} onClick={() => onChange('runir')} className="flex-1 justify-center text-xs">{terms.runir}</ContextTabButton>
    </nav>
  )
}

function GreinarList({ trails, selectedId, onSelect, onNew }: { trails: CairnTrailView[]; selectedId: string | null; onSelect: (id: string) => void; onNew: () => void }) {
  const terms = useTerms()
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">{trails.length} total</span>
        <ToolbarTooltip label={`New ${terms.greinSingular.toLowerCase()}`}>
          <Button type="button" size="icon" variant="secondary" className="h-7 w-7" onClick={onNew} aria-label={`New ${terms.greinSingular.toLowerCase()}`}>
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {trails.length === 0 ? <p className="px-3 py-4 text-xs text-muted-foreground">No {terms.greinar.toLowerCase()} yet.</p> : (
          <ul>
            {trails.map((trail) => (
              <li key={trail.id}>
                <button type="button" onClick={() => onSelect(trail.id)} className={cn('flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted-hover', selectedId === trail.id && 'bg-primary/10 text-primary')}>
                  <span className="truncate font-medium">{trail.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function CairnCatalogInspector({
  activeTab, onTabChange, trails, markers, selectedId, markerPath, markerParent,
  onSelectId, onMarkerPathChange, onMarkerParentChange, onClearSelection,
}: {
  activeTab: CairnCatalogTab; onTabChange: (tab: CairnCatalogTab) => void; trails: CairnTrailView[]; markers: CairnMarkerView[]; selectedId: string | null; markerPath: string[]; markerParent: string | null; onSelectId: (id: string | null) => void; onMarkerPathChange: (path: string[]) => void; onMarkerParentChange: (parent: string | null) => void; onClearSelection: () => void
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [markerFilter, setMarkerFilter] = useState('')

  const sortedTrails = useMemo(() => [...trails].sort((a, b) => a.name.localeCompare(b.name)), [trails])
  const selectedTrail = activeTab === 'greinar' && selectedId && selectedId !== 'new' ? (trails.find((t) => t.id === selectedId) ?? null) : null
  const isNewTrail = activeTab === 'greinar' && selectedId === 'new'
  const selectedMarker = activeTab === 'runir' && selectedId && selectedId !== 'new' ? (markers.find((m) => m.id === selectedId) ?? null) : null
  const isNewMarker = activeTab === 'runir' && selectedId === 'new'

  const invalidateCairn = () => {
    void queryClient.invalidateQueries({ queryKey: ['cairn-trails'] })
    void queryClient.invalidateQueries({ queryKey: ['cairn-markers'] })
    void queryClient.invalidateQueries({ queryKey: ['cairn-waypoints'] })
  }

  const saveTrail = useMutation({
    mutationFn: async (name: string) => isNewTrail ? createCairnTrail({ name }) : updateCairnTrail(selectedId!, { name }),
    onSuccess: () => { toast.success(isNewTrail ? 'Grein created' : 'Grein saved'); invalidateCairn(); onClearSelection() },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save grein'),
  })

  const deleteTrail = useMutation({
    mutationFn: () => deleteCairnTrail(selectedId!),
    onSuccess: () => { toast.success('Grein deleted'); invalidateCairn(); onClearSelection() },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  const saveMarker = useMutation({
    mutationFn: async (values: { name: string; color: string; icon: string | null }) => isNewMarker ? createCairnMarker(values) : updateCairnMarker(selectedId!, values),
    onSuccess: () => { toast.success(isNewMarker ? `${terms.runSingular} created` : `${terms.runSingular} saved`); invalidateCairn(); onClearSelection() },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save run'),
  })

  const deleteMarker = useMutation({
    mutationFn: () => deleteCairnMarker(selectedId!),
    onSuccess: () => { toast.success(`${terms.runSingular} deleted`); invalidateCairn(); onClearSelection() },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  if (activeTab === 'greinar' && selectedId) {
    return (
      <TrailInspector trail={selectedTrail} isNew={isNewTrail} title={isNewTrail ? `New ${terms.greinSingular}` : `Edit ${terms.greinSingular}`} onBack={onClearSelection} onSave={async (name) => { await saveTrail.mutateAsync(name) }} onDelete={async () => { await deleteTrail.mutateAsync() }} isSaving={saveTrail.isPending} />
    )
  }

  if (activeTab === 'runir' && selectedId) {
    return (
      <MarkerInspector marker={selectedMarker} isNew={isNewMarker} parentPrefix={markerParent} title={isNewMarker ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`} onBack={onClearSelection} onSave={async (values) => { await saveMarker.mutateAsync(values) }} onDelete={async () => { await deleteMarker.mutateAsync() }} isSaving={saveMarker.isPending} />
    )
  }

  return (
    <div className="flex h-full flex-col">
      <CatalogTabBar active={activeTab} onChange={onTabChange} />
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">{activeTab === 'greinar' ? terms.greinar : terms.runir}</p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {activeTab === 'greinar' ? `Organize ${terms.laufar.toLowerCase()} and ${terms.spjold.toLowerCase()} into named ${terms.greinar.toLowerCase()}.` : `Tag ${terms.laufar.toLowerCase()} with hierarchical ${terms.runir.toLowerCase()}.`}
        </p>
      </div>
      {activeTab === 'greinar' ? (
        <GreinarList trails={sortedTrails} selectedId={selectedId} onSelect={onSelectId} onNew={() => onSelectId('new')} />
      ) : (
        <MarkersBrowser markers={markers} search={markerFilter} onSearchChange={setMarkerFilter} groupPath={markerPath} selectedId={selectedId} onSelect={(id) => onSelectId(id)}
          onNew={() => onSelectId('new')} onNewSubmarker={(parent: MarkerParentContext) => { onMarkerParentChange(parent.name); onSelectId('new') }}
          onNavigateInto={(path) => { onMarkerPathChange(path); onSelectId(null) }} />
      )}
    </div>
  )
}

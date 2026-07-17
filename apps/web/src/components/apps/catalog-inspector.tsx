import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { FjallMarkerView, FjallTrailView } from '@/lib/data-types'
import { MarkersBrowser, type MarkerParentContext } from '@/components/apps/markers-browser'
import { MarkerInspector } from '@/components/apps/marker-inspector'
import { TrailInspector } from '@/components/apps/trail-inspector'
import { Button } from '@/components/core/ui/button'
import { ContextTabButton } from '@/components/core/ui/context-tab'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createFjallMarker,
  createFjallTrail,
  deleteFjallMarker,
  deleteFjallTrail,
  updateFjallMarker,
  updateFjallTrail,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { cn } from '@/lib/utils'

export type FjallCatalogTab = 'greinar' | 'runir'

function CatalogTabBar({
  active,
  onChange,
}: {
  active: FjallCatalogTab
  onChange: (tab: FjallCatalogTab) => void
}) {
  const terms = useTerms()
  const GreinarIcon = ASGARD_ENTITY_ICONS.greinar
  const RunirIcon = ASGARD_ENTITY_ICONS.runir
  return (
    <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Fjall catalog">
      <ContextTabButton
        active={active === 'greinar'}
        onClick={() => onChange('greinar')}
        className="flex-1 justify-center gap-1.5 text-xs"
      >
        <GreinarIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {terms.greinar}
      </ContextTabButton>
      <ContextTabButton
        active={active === 'runir'}
        onClick={() => onChange('runir')}
        className="flex-1 justify-center gap-1.5 text-xs"
      >
        <RunirIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {terms.runir}
      </ContextTabButton>
    </nav>
  )
}

function GreinarList({
  trails,
  selectedId,
  onSelect,
  onNew,
}: {
  trails: FjallTrailView[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const terms = useTerms()
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">{trails.length} total</span>
        <ToolbarTooltip label={`New ${terms.greinSingular.toLowerCase()}`}>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onNew}
            aria-label={`New ${terms.greinSingular.toLowerCase()}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {trails.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No greinar yet.</p>
        ) : (
          <ul>
            {trails.map((trail) => (
              <li key={trail.id}>
                <button
                  type="button"
                  onClick={() => onSelect(trail.id)}
                  className={cn(
                    'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted-hover',
                    selectedId === trail.id && 'bg-primary/10 text-primary',
                  )}
                >
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

export function FjallCatalogInspector({
  activeTab,
  onTabChange,
  trails,
  markers,
  selectedId,
  markerPath,
  markerParent,
  onSelectId,
  onMarkerPathChange,
  onMarkerParentChange,
  onClearSelection,
  lockedTab,
  rootMarkerPath = [],
}: {
  activeTab: FjallCatalogTab
  onTabChange: (tab: FjallCatalogTab) => void
  trails: FjallTrailView[]
  markers: FjallMarkerView[]
  selectedId: string | null
  markerPath: string[]
  markerParent: string | null
  onSelectId: (id: string | null) => void
  onMarkerPathChange: (path: string[]) => void
  onMarkerParentChange: (parent: string | null) => void
  onClearSelection: () => void
  /** When set, hide the tab bar and keep the inspector on this tab. */
  lockedTab?: FjallCatalogTab
  /** When set, Runir browsing cannot navigate above this path. */
  rootMarkerPath?: string[]
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [markerFilter, setMarkerFilter] = useState('')
  const effectiveTab = lockedTab ?? activeTab

  const sortedTrails = useMemo(
    () => [...trails].sort((a, b) => a.name.localeCompare(b.name)),
    [trails],
  )

  const selectedTrail =
    effectiveTab === 'greinar' && selectedId && selectedId !== 'new'
      ? (trails.find((trail) => trail.id === selectedId) ?? null)
      : null
  const isNewTrail = effectiveTab === 'greinar' && selectedId === 'new'

  const selectedMarker =
    effectiveTab === 'runir' && selectedId && selectedId !== 'new'
      ? (markers.find((marker) => marker.id === selectedId) ?? null)
      : null
  const isNewMarker = effectiveTab === 'runir' && selectedId === 'new'

  const invalidateFjall = () => {
    void queryClient.invalidateQueries({ queryKey: ['fjall-trails'] })
    void queryClient.invalidateQueries({ queryKey: ['fjall-markers'] })
    void queryClient.invalidateQueries({ queryKey: ['fjall-waypoints'] })
  }

  const saveTrail = useMutation({
    mutationFn: async (name: string) => {
      if (isNewTrail) return createFjallTrail({ name })
      return updateFjallTrail(selectedId!, { name })
    },
    onSuccess: () => {
      toast.success(isNewTrail ? 'Grein created' : 'Grein saved')
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save grein'),
  })

  const deleteTrail = useMutation({
    mutationFn: () => deleteFjallTrail(selectedId!),
    onSuccess: () => {
      toast.success('Grein deleted')
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  const saveMarker = useMutation({
    mutationFn: async (values: { name: string; color: string; icon: string | null }) => {
      if (isNewMarker) return createFjallMarker(values)
      return updateFjallMarker(selectedId!, values)
    },
    onSuccess: () => {
      toast.success(isNewMarker ? `${terms.runSingular} created` : `${terms.runSingular} saved`)
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save run'),
  })

  const deleteMarker = useMutation({
    mutationFn: () => deleteFjallMarker(selectedId!),
    onSuccess: () => {
      toast.success(`${terms.runSingular} deleted`)
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  if (effectiveTab === 'greinar' && selectedId) {
    return (
      <TrailInspector
        trail={selectedTrail}
        isNew={isNewTrail}
        title={
          isNewTrail
            ? `New ${terms.greinSingular}`
            : `Edit ${terms.greinSingular}`
        }
        onBack={onClearSelection}
        onSave={async (name) => {
          await saveTrail.mutateAsync(name)
        }}
        onDelete={async () => {
          await deleteTrail.mutateAsync()
        }}
        isSaving={saveTrail.isPending}
      />
    )
  }

  if (effectiveTab === 'runir' && selectedId) {
    return (
      <MarkerInspector
        marker={selectedMarker}
        isNew={isNewMarker}
        parentPrefix={markerParent}
        title={isNewMarker ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`}
        onBack={onClearSelection}
        onSave={async (values) => {
          await saveMarker.mutateAsync(values)
        }}
        onDelete={async () => {
          await deleteMarker.mutateAsync()
        }}
        isSaving={saveMarker.isPending}
      />
    )
  }

  const runirCopy =
    rootMarkerPath.length > 0
      ? `Manage ${rootMarkerPath.join('/')} and its nested ${terms.runir.toLowerCase()}.`
      : `Tag ${terms.laufar.toLowerCase()} with hierarchical ${terms.runir.toLowerCase()}.`

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {lockedTab ? null : <CatalogTabBar active={activeTab} onChange={onTabChange} />}
      <div className="border-b border-border px-4 py-3">
        <p className="text-sm font-semibold text-foreground">
          {effectiveTab === 'greinar'
            ? terms.greinar
            : rootMarkerPath.length > 0
              ? rootMarkerPath[rootMarkerPath.length - 1]
              : terms.runir}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {effectiveTab === 'greinar'
            ? `Organize ${terms.laufar.toLowerCase()} and ${terms.spjold.toLowerCase()} into named ${terms.greinar.toLowerCase()}.`
            : runirCopy}
        </p>
      </div>
      {effectiveTab === 'greinar' ? (
        <GreinarList
          trails={sortedTrails}
          selectedId={selectedId}
          onSelect={onSelectId}
          onNew={() => onSelectId('new')}
        />
      ) : (
        <MarkersBrowser
          markers={markers}
          search={markerFilter}
          onSearchChange={setMarkerFilter}
          groupPath={markerPath}
          selectedId={selectedId}
          onSelect={(id) => onSelectId(id)}
          onNew={() => onSelectId('new')}
          onNewSubmarker={(parent: MarkerParentContext) => {
            onMarkerParentChange(parent.name)
            onSelectId('new')
          }}
          onNavigateInto={(path) => {
            if (
              rootMarkerPath.length > 0 &&
              (path.length < rootMarkerPath.length ||
                !rootMarkerPath.every((segment, index) => path[index] === segment))
            ) {
              return
            }
            onMarkerPathChange(path)
            onSelectId(null)
          }}
          rootPath={rootMarkerPath}
        />
      )}
    </div>
  )
}

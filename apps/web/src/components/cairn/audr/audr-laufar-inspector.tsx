import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { CairnMarkerView, CairnTrailView, CairnWaypointView } from '@/lib/cairn-types'
import { WaypointInspector, type WaypointDraft } from '@/components/cairn/waypoint-inspector'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createCairnWaypoint,
  deleteCairnWaypoint,
  fetchCairnWaypoints,
  updateCairnWaypoint,
} from '@/lib/cairn-api'
import { toWaypointView } from '@/lib/cairn-format'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { useTerms } from '@/hooks/use-terminology'
import { cn, includesFoldedSearch } from '@/lib/utils'

function isUnderRoot(markerName: string, root: string) {
  return markerName === root || markerName.startsWith(`${root}/`)
}

function normalizeHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return trimmed.includes('://') ? trimmed : `https://${trimmed}`
}

export function AudrLaufarInspector({
  trails,
  markers,
  rootMarkerName,
  selectedId,
  onSelectId,
}: {
  trails: CairnTrailView[]
  markers: CairnMarkerView[]
  rootMarkerName: string
  selectedId: string | null
  onSelectId: (id: string | null) => void
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const LaufarIcon = ASGARD_ENTITY_ICONS.laufar

  const waypointsQuery = useQuery({
    queryKey: ['cairn-waypoints'],
    queryFn: fetchCairnWaypoints,
  })

  const trailsById = useMemo(() => new Map(trails.map((trail) => [trail.id, trail])), [trails])
  const provisionsMarkerIds = useMemo(() => {
    return new Set(
      markers.filter((marker) => isUnderRoot(marker.name, rootMarkerName)).map((marker) => marker.id),
    )
  }, [markers, rootMarkerName])
  const rootMarker = useMemo(
    () => markers.find((marker) => marker.name === rootMarkerName) ?? null,
    [markers, rootMarkerName],
  )

  const waypoints = useMemo(() => {
    const all = (waypointsQuery.data ?? []).map((waypoint) => toWaypointView(waypoint, trailsById))
    return all.filter((waypoint) =>
      waypoint.markers.some((marker) => provisionsMarkerIds.has(marker.id)),
    )
  }, [waypointsQuery.data, trailsById, provisionsMarkerIds])

  const filtered = useMemo(() => {
    if (!search.trim()) return waypoints
    return waypoints.filter((waypoint) => {
      const haystack = [
        waypoint.title,
        waypoint.url,
        waypoint.notes,
        ...waypoint.markers.map((marker) => marker.name),
      ].join(' ')
      return includesFoldedSearch(haystack, search)
    })
  }, [waypoints, search])

  const isNew = selectedId === 'new'
  const selectedWaypoint =
    selectedId && selectedId !== 'new'
      ? (waypoints.find((waypoint) => waypoint.id === selectedId) ?? null)
      : null

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cairn-waypoints'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (draft: WaypointDraft) => {
      const payload = {
        title: draft.title.trim() || draft.url.trim(),
        url: draft.url.trim(),
        notes: draft.notes.trim() || undefined,
        trailId: draft.trailId || null,
        markerIds: draft.markerIds,
      }
      if (isNew) return createCairnWaypoint(payload)
      return updateCairnWaypoint(selectedId!, payload)
    },
    onSuccess: () => {
      toast.success(isNew ? `${terms.laufarSingular} created` : `${terms.laufarSingular} saved`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to save ${terms.laufarSingular}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCairnWaypoint(selectedId!),
    onSuccess: () => {
      toast.success(`${terms.laufarSingular} deleted`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to delete ${terms.laufarSingular}`),
  })

  if (selectedId) {
    return (
      <WaypointInspector
        waypoint={selectedWaypoint}
        isNew={isNew}
        trails={trails}
        markers={markers.filter((marker) => isUnderRoot(marker.name, rootMarkerName))}
        markerPickerInitialPath={[rootMarkerName]}
        defaultMarkerIds={isNew && rootMarker ? [rootMarker.id] : undefined}
        showBack
        onClose={() => onSelectId(null)}
        onSave={async (draft) => {
          await saveMutation.mutateAsync(draft)
        }}
        onDelete={async () => {
          await deleteMutation.mutateAsync()
        }}
        isSaving={saveMutation.isPending || deleteMutation.isPending}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={terms.laufar} title={`Audr ${terms.laufar}`} />
      </InspectorChrome>
      <div className="border-b border-border px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Manage {terms.laufar.toLowerCase()} tagged with {rootMarkerName} or a nested{' '}
          {terms.runSingular.toLowerCase()}. Click a card to open the link.
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2 border-b border-border px-3 py-2">
        <FilterInput
          value={search}
          onChange={setSearch}
          placeholder={`Filter ${terms.laufar.toLowerCase()}…`}
          className="min-w-0 flex-1"
        />
        <ToolbarTooltip label={`New ${terms.laufarSingular}`}>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7 shrink-0"
            onClick={() => onSelectId('new')}
            aria-label={`New ${terms.laufarSingular}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="min-h-0 min-w-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3">
        {waypointsQuery.isLoading ? (
          <p className="px-1 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <LaufarIcon className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">
              No {terms.laufar.toLowerCase()} tagged under {rootMarkerName}.
            </p>
            <button
              type="button"
              onClick={() => onSelectId('new')}
              className="mt-1 text-sm text-primary hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          filtered.map((waypoint) => (
            <LaufarCard
              key={waypoint.id}
              waypoint={waypoint}
              onOpenLink={() => {
                const href = normalizeHref(waypoint.url)
                if (href) window.open(href, '_blank', 'noopener,noreferrer')
              }}
              onEdit={() => onSelectId(waypoint.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function LaufarCard({
  waypoint,
  onOpenLink,
  onEdit,
}: {
  waypoint: CairnWaypointView
  onOpenLink: () => void
  onEdit: () => void
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onOpenLink}
        className="flex w-full items-start gap-2.5 p-3 pr-10 text-left"
      >
        {waypoint.favicon ? (
          <img src={waypoint.favicon} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-sm" />
        ) : (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <ExternalLink className="h-3 w-3" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {waypoint.title || waypoint.url}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{waypoint.url}</span>
          {waypoint.markers.length > 0 ? (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {waypoint.markers.slice(0, 3).map((marker) => (
                <span
                  key={marker.id}
                  className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                >
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: marker.color }}
                    aria-hidden
                  />
                  {marker.name.split('/').pop()}
                </span>
              ))}
            </span>
          ) : null}
        </span>
      </button>
      <ToolbarTooltip label="Edit">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          className={cn(
            'absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
          aria-label={`Edit ${waypoint.title || waypoint.url}`}
        >
          <Settings className="h-3.5 w-3.5" aria-hidden />
        </button>
      </ToolbarTooltip>
    </div>
  )
}

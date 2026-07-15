import { useEffect, useState } from 'react'
import type { CairnMarkerView, CairnTrailView, CairnWaypointView } from '@/lib/cairn-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { Select } from '@/components/core/ui/select'
import { fetchCairnWaypointMeta } from '@/lib/cairn-api'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'

export type WaypointDraft = {
  title: string
  url: string
  notes: string
  trailId: string
  markerIds: string[]
}

function draftFromWaypoint(waypoint: CairnWaypointView | null): WaypointDraft {
  return {
    title: waypoint?.title ?? '',
    url: waypoint?.url ?? '',
    notes: waypoint?.notes ?? '',
    trailId: waypoint?.trailId ?? '',
    markerIds: waypoint?.markers.map((marker) => marker.id) ?? [],
  }
}

export function WaypointInspector({
  waypoint,
  isNew,
  trails,
  markers,
  onClose,
  onSave,
  onDelete,
  isSaving,
  markerPickerInitialPath,
  defaultMarkerIds,
  showBack = false,
}: {
  waypoint: CairnWaypointView | null
  isNew: boolean
  trails: CairnTrailView[]
  markers: CairnMarkerView[]
  onClose: () => void
  onSave: (draft: WaypointDraft) => Promise<void>
  onDelete: () => Promise<void>
  isSaving: boolean
  markerPickerInitialPath?: string[]
  /** Applied once when creating a new lauf and no markers are set yet. */
  defaultMarkerIds?: string[]
  showBack?: boolean
}) {
  const terms = useTerms()
  const [draft, setDraft] = useState<WaypointDraft>(() => {
    const initial = draftFromWaypoint(waypoint)
    if (isNew && defaultMarkerIds?.length && initial.markerIds.length === 0) {
      return { ...initial, markerIds: defaultMarkerIds }
    }
    return initial
  })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)

  useEffect(() => {
    const next = draftFromWaypoint(waypoint)
    if (isNew && defaultMarkerIds?.length && next.markerIds.length === 0) {
      setDraft({ ...next, markerIds: defaultMarkerIds })
      return
    }
    setDraft(next)
  }, [waypoint, isNew, defaultMarkerIds])

  async function handleUrlBlur() {
    const url = draft.url.trim()
    if (!url || draft.title.trim()) return
    setFetchingMeta(true)
    try {
      const meta = await fetchCairnWaypointMeta(url)
      setDraft((current) => ({
        ...current,
        title: meta.title ?? current.title,
      }))
    } catch {
      // optional enrichment
    } finally {
      setFetchingMeta(false)
    }
  }

  function setMarkerIds(markerIds: string[]) {
    setDraft((current) => ({ ...current, markerIds }))
  }

  const rawMarkers = markers.map((marker) => ({
    id: marker.id,
    name: marker.name,
    color: marker.color,
    icon: marker.icon,
  }))

  const headerTitle = isNew
    ? `New ${terms.laufarSingular}`
    : `Edit ${terms.laufarSingular}`

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorFormHeader
        title={headerTitle}
        icon={ASGARD_ENTITY_ICONS.laufar}
        onBack={onClose}
        showBack={showBack}
      />
      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Title</span>
          <Input
            value={draft.title}
            onChange={(event) => setDraft({ ...draft, title: event.target.value })}
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">URL</span>
          <Input
            value={draft.url}
            onChange={(event) => setDraft({ ...draft, url: event.target.value })}
            onBlur={() => void handleUrlBlur()}
            placeholder="https://example.com"
          />
          {fetchingMeta ? (
            <span className="text-[11px] text-muted-foreground">Fetching page title…</span>
          ) : null}
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Notes</span>
          <textarea
            value={draft.notes}
            onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
            rows={4}
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{terms.greinar}</span>
          <Select
            value={draft.trailId}
            onChange={(trailId) => setDraft({ ...draft, trailId })}
            placeholder={terms.unassigned}
            options={[
              { value: '', label: terms.unassigned },
              ...trails.map((trail) => ({ value: trail.id, label: trail.name })),
            ]}
          />
        </label>

        {markers.length > 0 ? (
          <label className="block min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{terms.runir}</span>
            <MarkerPicker
              markers={rawMarkers}
              selected={draft.markerIds}
              onChange={setMarkerIds}
              placeholder={`Select ${terms.runir.toLowerCase()}`}
              initialPath={markerPickerInitialPath}
            />
          </label>
        ) : null}
      </div>
      <InspectorFormActions
        isNew={isNew}
        isSaving={isSaving}
        canSave={!!draft.url.trim()}
        createLabel={`Create ${terms.laufarSingular}`}
        saveLabel="Save"
        deleteLabel={`Delete ${terms.laufarSingular.toLowerCase()}`}
        onSave={() => void onSave(draft)}
        showDelete={!isNew}
        onDelete={() => setDeleteOpen(true)}
        className="px-4"
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${terms.laufarSingular}`}
        description={`Delete "${waypoint?.title || waypoint?.url}"?`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          void (async () => {
            await onDelete()
            setDeleteOpen(false)
          })()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}

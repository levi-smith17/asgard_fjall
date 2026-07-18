import { useEffect, useMemo, useState } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { MarkerPicker } from '@/components/apps/marker-picker'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { ContextTabButton } from '@/components/core/ui/context-tab'
import { Input } from '@/components/core/ui/input'
import {
  InspectorChrome,
  InspectorChromeTitle,
} from '@/components/core/ui/inspector-chrome'
import { InspectorFormActions } from '@/components/core/ui/inspector-form-actions'
import { Select } from '@/components/core/ui/select'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { SogurRailMarker } from './sogur-rail'
import type { SogurWaypointOption } from './sogur-laufar-picker'

export type SogurSagaOption = {
  id: string
  name: string
  trailId: string | null
}

export type SogurInspectorThattr = {
  id: string
  title: string
}

type SogurCreateInput = {
  name: string
  trailId: string | null
  markerIds: string[]
  sagaId?: string | null
}

export type SogurCreateDraft = {
  name: string
  sagaId: string | null
  markerIds: string[]
}

function AssociationFields({
  trailId,
  onTrailIdChange,
  markerIds,
  onMarkerIdsChange,
  greinar,
  runir,
  trailDisabled,
  trailHelp,
}: {
  trailId: string | null
  onTrailIdChange: (id: string | null) => void
  markerIds: string[]
  onMarkerIdsChange: (ids: string[]) => void
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailMarker[]
  trailDisabled?: boolean
  trailHelp?: string
}) {
  const terms = useTerms()
  return (
    <>
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground" htmlFor="sogur-grein">
          {terms.greinSingular}
        </label>
        <Select
          id="sogur-grein"
          value={trailId ?? ''}
          onChange={(value) => onTrailIdChange(value || null)}
          options={[
            { value: '', label: terms.unassigned },
            ...greinar.map((grein) => ({ value: grein.id, label: grein.name })),
          ]}
          disabled={trailDisabled}
        />
        {trailHelp ? <p className="text-[11px] text-muted-foreground">{trailHelp}</p> : null}
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.runir}</span>
        <MarkerPicker
          markers={runir}
          selected={markerIds}
          onChange={onMarkerIdsChange}
          placeholder={terms.runir}
          triggerClassName="w-full"
        />
      </div>
    </>
  )
}

export function SogurCreateInspector({
  kind,
  defaultSagaId = null,
  sagas,
  greinar,
  runir,
  creating,
  onCreate,
  onDraftChange,
}: {
  kind: 'saga' | 'thattr'
  defaultSagaId?: string | null
  sagas: SogurSagaOption[]
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailMarker[]
  creating?: boolean
  onCreate: (input: SogurCreateInput) => void
  onDraftChange?: (draft: SogurCreateDraft) => void
}) {
  const terms = useTerms()
  const [name, setName] = useState('')
  const [sagaId, setSagaId] = useState<string | null>(defaultSagaId)
  const selectedSaga = sagas.find((saga) => saga.id === sagaId) ?? null
  const [trailId, setTrailId] = useState<string | null>(selectedSaga?.trailId ?? null)
  const [markerIds, setMarkerIds] = useState<string[]>([])

  useEffect(() => {
    setSagaId(defaultSagaId)
  }, [defaultSagaId])
  useEffect(() => {
    if (kind === 'thattr' && selectedSaga) setTrailId(selectedSaga.trailId)
  }, [kind, selectedSaga])

  useEffect(() => {
    if (kind !== 'thattr') return
    onDraftChange?.({ name, sagaId, markerIds })
  }, [kind, name, sagaId, markerIds, onDraftChange])

  const singular = kind === 'saga' ? terms.notesSingular : terms.thattrSingular
  const canCreate = name.trim().length > 0 && !creating

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow="Inspector"
          title={`Add ${singular}`}
        />
      </InspectorChrome>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="sogur-name">
            Name
          </label>
          <Input
            id="sogur-name"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={kind === 'saga' ? `New ${terms.notesSingular}` : `New ${terms.thattrSingular}`}
            autoFocus
          />
        </div>
        {kind === 'thattr' ? (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="sogur-saga">
              {terms.notesSingular}
            </label>
            <Select
              id="sogur-saga"
              value={sagaId ?? ''}
              onChange={(value) => setSagaId(value || null)}
              options={[
                { value: '', label: `Standalone ${terms.thattrSingular}` },
                ...sagas.map((saga) => ({ value: saga.id, label: saga.name })),
              ]}
            />
          </div>
        ) : null}
        <AssociationFields
          trailId={trailId}
          onTrailIdChange={setTrailId}
          markerIds={markerIds}
          onMarkerIdsChange={setMarkerIds}
          greinar={greinar}
          runir={runir}
          trailDisabled={kind === 'thattr' && selectedSaga != null}
          trailHelp={
            kind === 'thattr' && selectedSaga
              ? `${terms.greinSingular} is inherited from ${selectedSaga.name}.`
              : undefined
          }
        />
      </div>
      <InspectorFormActions
        isNew
        isSaving={creating}
        canSave={canCreate}
        createLabel={`Add ${singular}`}
        onSave={() =>
          onCreate({
            name: name.trim(),
            trailId: selectedSaga?.trailId ?? trailId,
            markerIds,
            ...(kind === 'thattr' ? { sagaId } : {}),
          })
        }
      />
    </div>
  )
}

function SortableOrderRow({ thattr, index }: { thattr: SogurInspectorThattr; index: number }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: thattr.id,
  })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'flex items-center gap-2 border-b border-border px-4 py-3 text-sm',
        isDragging && 'opacity-50',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        aria-label={`Move ${thattr.title}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" aria-hidden />
      </button>
      <span className="w-5 text-right text-xs tabular-nums text-muted-foreground">{index + 1}</span>
      <span className="min-w-0 flex-1 truncate font-medium">{thattr.title}</span>
    </div>
  )
}

export function SogurSagaInspector({
  saga,
  thaettir,
  greinar,
  runir,
  saving,
  onSave,
  onDelete,
  onReorder,
}: {
  saga: {
    id: string
    name: string
    trailId: string | null
    markerIds: string[]
  }
  thaettir: SogurInspectorThattr[]
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailMarker[]
  saving?: boolean
  onSave: (input: { name: string; trailId: string | null; markerIds: string[] }) => void
  onDelete: () => void
  onReorder: (orderedIds: string[]) => Promise<void>
}) {
  const terms = useTerms()
  const [tab, setTab] = useState<'details' | 'order'>('details')
  const [name, setName] = useState(saga.name)
  const [trailId, setTrailId] = useState<string | null>(saga.trailId)
  const [markerIds, setMarkerIds] = useState(saga.markerIds)
  const [ordered, setOrdered] = useState(thaettir)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = useMemo(() => ordered.map((thattr) => thattr.id), [ordered])

  useEffect(() => {
    setName(saga.name)
    setTrailId(saga.trailId)
    setMarkerIds(saga.markerIds)
  }, [saga])
  useEffect(() => setOrdered(thaettir), [thaettir])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = ordered.findIndex((thattr) => thattr.id === active.id)
    const to = ordered.findIndex((thattr) => thattr.id === over.id)
    if (from < 0 || to < 0) return
    const previous = ordered
    const next = arrayMove(ordered, from, to)
    setOrdered(next)
    try {
      await onReorder(next.map((thattr) => thattr.id))
    } catch {
      setOrdered(previous)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <nav className="flex h-14 shrink-0 border-b border-border" aria-label={`${terms.notesSingular} inspector tabs`}>
        <ContextTabButton
          active={tab === 'details'}
          onClick={() => setTab('details')}
          className="flex-1 justify-center gap-1.5 text-xs"
        >
          Edit
        </ContextTabButton>
        <ContextTabButton
          active={tab === 'order'}
          onClick={() => setTab('order')}
          className="flex-1 justify-center gap-1.5 text-xs"
        >
          {terms.thattrSingular} Order
        </ContextTabButton>
      </nav>
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Inspector" title={`Edit ${terms.notesSingular}`} />
      </InspectorChrome>
      {tab === 'details' ? (
        <>
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="saga-name">
                Name
              </label>
              <Input id="saga-name" value={name} onChange={(event) => setName(event.target.value)} />
            </div>
            <AssociationFields
              trailId={trailId}
              onTrailIdChange={setTrailId}
              markerIds={markerIds}
              onMarkerIdsChange={setMarkerIds}
              greinar={greinar}
              runir={runir}
            />
          </div>
          <InspectorFormActions
            isNew={false}
            isSaving={saving}
            canSave={name.trim().length > 0}
            onSave={() => onSave({ name: name.trim(), trailId, markerIds })}
            onDelete={() => setConfirmDelete(true)}
            showDelete
            deleteLabel={`Delete ${terms.notesSingular.toLowerCase()}`}
          />
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto">
          <p className="border-b border-border px-5 py-3 text-xs text-muted-foreground">
            Drag {terms.thaettir.toLowerCase()} to set their order.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={verticalListSortingStrategy}>
              {ordered.map((thattr, index) => (
                <SortableOrderRow key={thattr.id} thattr={thattr} index={index} />
              ))}
            </SortableContext>
          </DndContext>
        </div>
      )}
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${terms.notesSingular.toLowerCase()}?`}
        description={`The ${terms.thaettir.toLowerCase()} will become standalone and will not be deleted.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />
    </div>
  )
}

export function SogurThattrInspector({
  thattr,
  sagas,
  greinar,
  runir,
  laufar,
  saving,
  onSave,
  onDelete,
}: {
  thattr: {
    id: string
    title: string
    sagaId: string | null
    trailId: string | null
    markerIds: string[]
    waypointId: string | null
  }
  sagas: SogurSagaOption[]
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailMarker[]
  laufar: SogurWaypointOption[]
  saving?: boolean
  onSave: (input: {
    title: string
    sagaId: string | null
    trailId: string | null
    markerIds: string[]
    waypointId: string | null
  }) => void
  onDelete: () => void
}) {
  const terms = useTerms()
  const [title, setTitle] = useState(thattr.title)
  const [sagaId, setSagaId] = useState<string | null>(thattr.sagaId)
  const selectedSaga = sagas.find((saga) => saga.id === sagaId) ?? null
  const [trailId, setTrailId] = useState<string | null>(thattr.trailId)
  const [markerIds, setMarkerIds] = useState(thattr.markerIds)
  const [waypointId, setWaypointId] = useState<string | null>(thattr.waypointId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(thattr.title)
    setSagaId(thattr.sagaId)
    setTrailId(thattr.trailId)
    setMarkerIds(thattr.markerIds)
    setWaypointId(thattr.waypointId)
  }, [thattr])
  useEffect(() => {
    if (selectedSaga) setTrailId(selectedSaga.trailId)
  }, [selectedSaga])

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Inspector" title={`Edit ${terms.thattrSingular}`} />
      </InspectorChrome>
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="thattr-name">
            Name
          </label>
          <Input id="thattr-name" value={title} onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="thattr-saga">
            {terms.notesSingular}
          </label>
          <Select
            id="thattr-saga"
            value={sagaId ?? ''}
            onChange={(value) => setSagaId(value || null)}
            options={[
              { value: '', label: `Standalone ${terms.thattrSingular}` },
              ...sagas.map((saga) => ({ value: saga.id, label: saga.name })),
            ]}
          />
        </div>
        <AssociationFields
          trailId={trailId}
          onTrailIdChange={setTrailId}
          markerIds={markerIds}
          onMarkerIdsChange={setMarkerIds}
          greinar={greinar}
          runir={runir}
          trailDisabled={selectedSaga != null}
          trailHelp={
            selectedSaga
              ? `${terms.greinSingular} is inherited from ${selectedSaga.name}.`
              : undefined
          }
        />
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground" htmlFor="thattr-lauf">
            {terms.laufarSingular}
          </label>
          <Select
            id="thattr-lauf"
            value={waypointId ?? ''}
            onChange={(value) => setWaypointId(value || null)}
            options={[
              { value: '', label: `No ${terms.laufarSingular.toLowerCase()}` },
              ...laufar.map((lauf) => ({ value: lauf.id, label: lauf.title })),
            ]}
          />
        </div>
      </div>
      <InspectorFormActions
        isNew={false}
        isSaving={saving}
        canSave={title.trim().length > 0}
        onSave={() =>
          onSave({
            title: title.trim(),
            sagaId,
            trailId: selectedSaga?.trailId ?? trailId,
            markerIds,
            waypointId,
          })
        }
        onDelete={() => setConfirmDelete(true)}
        showDelete
        deleteLabel={`Delete ${terms.thattrSingular.toLowerCase()}`}
      />
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${terms.thattrSingular.toLowerCase()}?`}
        description={`This ${terms.thattrSingular.toLowerCase()} will be permanently deleted.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false)
          onDelete()
        }}
      />
    </div>
  )
}

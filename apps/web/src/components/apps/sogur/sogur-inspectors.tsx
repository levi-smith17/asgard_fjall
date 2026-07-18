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
import { RunPicker } from '@/components/apps/run-picker'
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
import type { SogurRailRun } from './sogur-rail'
import type { SogurLaufOption } from './sogur-laufar-picker'

export type SogurSagaOption = {
  id: string
  name: string
  greinId: string | null
}

export type SogurInspectorThattr = {
  id: string
  title: string
}

type SogurCreateInput = {
  name: string
  greinId: string | null
  runIds: string[]
  sagaId?: string | null
}

export type SogurCreateDraft = {
  name: string
  sagaId: string | null
  runIds: string[]
}

function AssociationFields({
  greinId,
  onGreinIdChange,
  runIds,
  onRunIdsChange,
  greinar,
  runir,
  greinDisabled,
  greinHelp,
}: {
  greinId: string | null
  onGreinIdChange: (id: string | null) => void
  runIds: string[]
  onRunIdsChange: (ids: string[]) => void
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailRun[]
  greinDisabled?: boolean
  greinHelp?: string
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
          value={greinId ?? ''}
          onChange={(value) => onGreinIdChange(value || null)}
          options={[
            { value: '', label: terms.unassigned },
            ...greinar.map((grein) => ({ value: grein.id, label: grein.name })),
          ]}
          disabled={greinDisabled}
        />
        {greinHelp ? <p className="text-[11px] text-muted-foreground">{greinHelp}</p> : null}
      </div>
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.runir}</span>
        <RunPicker
          runir={runir}
          selected={runIds}
          onChange={onRunIdsChange}
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
  runir: SogurRailRun[]
  creating?: boolean
  onCreate: (input: SogurCreateInput) => void
  onDraftChange?: (draft: SogurCreateDraft) => void
}) {
  const terms = useTerms()
  const [name, setName] = useState('')
  const [sagaId, setSagaId] = useState<string | null>(defaultSagaId)
  const selectedSaga = sagas.find((saga) => saga.id === sagaId) ?? null
  const [greinId, setGreinId] = useState<string | null>(selectedSaga?.greinId ?? null)
  const [runIds, setRunIds] = useState<string[]>([])

  useEffect(() => {
    setSagaId(defaultSagaId)
  }, [defaultSagaId])
  useEffect(() => {
    if (kind === 'thattr' && selectedSaga) setGreinId(selectedSaga.greinId)
  }, [kind, selectedSaga])

  useEffect(() => {
    if (kind !== 'thattr') return
    onDraftChange?.({ name, sagaId, runIds })
  }, [kind, name, sagaId, runIds, onDraftChange])

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
          greinId={greinId}
          onGreinIdChange={setGreinId}
          runIds={runIds}
          onRunIdsChange={setRunIds}
          greinar={greinar}
          runir={runir}
          greinDisabled={kind === 'thattr' && selectedSaga != null}
          greinHelp={
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
            greinId: selectedSaga?.greinId ?? greinId,
            runIds,
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
    greinId: string | null
    runIds: string[]
  }
  thaettir: SogurInspectorThattr[]
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailRun[]
  saving?: boolean
  onSave: (input: { name: string; greinId: string | null; runIds: string[] }) => void
  onDelete: () => void
  onReorder: (orderedIds: string[]) => Promise<void>
}) {
  const terms = useTerms()
  const [tab, setTab] = useState<'details' | 'order'>('details')
  const [name, setName] = useState(saga.name)
  const [greinId, setGreinId] = useState<string | null>(saga.greinId)
  const [runIds, setRunIds] = useState(saga.runIds)
  const [ordered, setOrdered] = useState(thaettir)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = useMemo(() => ordered.map((thattr) => thattr.id), [ordered])

  useEffect(() => {
    setName(saga.name)
    setGreinId(saga.greinId)
    setRunIds(saga.runIds)
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
              greinId={greinId}
              onGreinIdChange={setGreinId}
              runIds={runIds}
              onRunIdsChange={setRunIds}
              greinar={greinar}
              runir={runir}
            />
          </div>
          <InspectorFormActions
            isNew={false}
            isSaving={saving}
            canSave={name.trim().length > 0}
            onSave={() => onSave({ name: name.trim(), greinId, runIds })}
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
    greinId: string | null
    runIds: string[]
    laufId: string | null
  }
  sagas: SogurSagaOption[]
  greinar: Array<{ id: string; name: string }>
  runir: SogurRailRun[]
  laufar: SogurLaufOption[]
  saving?: boolean
  onSave: (input: {
    title: string
    sagaId: string | null
    greinId: string | null
    runIds: string[]
    laufId: string | null
  }) => void
  onDelete: () => void
}) {
  const terms = useTerms()
  const [title, setTitle] = useState(thattr.title)
  const [sagaId, setSagaId] = useState<string | null>(thattr.sagaId)
  const selectedSaga = sagas.find((saga) => saga.id === sagaId) ?? null
  const [greinId, setGreinId] = useState<string | null>(thattr.greinId)
  const [runIds, setRunIds] = useState(thattr.runIds)
  const [laufId, setLaufId] = useState<string | null>(thattr.laufId)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    setTitle(thattr.title)
    setSagaId(thattr.sagaId)
    setGreinId(thattr.greinId)
    setRunIds(thattr.runIds)
    setLaufId(thattr.laufId)
  }, [thattr])
  useEffect(() => {
    if (selectedSaga) setGreinId(selectedSaga.greinId)
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
          greinId={greinId}
          onGreinIdChange={setGreinId}
          runIds={runIds}
          onRunIdsChange={setRunIds}
          greinar={greinar}
          runir={runir}
          greinDisabled={selectedSaga != null}
          greinHelp={
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
            value={laufId ?? ''}
            onChange={(value) => setLaufId(value || null)}
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
            greinId: selectedSaga?.greinId ?? greinId,
            runIds,
            laufId,
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

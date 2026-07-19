import { useEffect, useState } from 'react'
import type { FjallRunView, FjallGreinView, FjallLaufView } from '@/lib/data-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { RunPicker } from '@/components/apps/run-picker'
import { Select } from '@/components/core/ui/select'
import { fetchFjallLaufMeta } from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'

export type LaufDraft = {
  title: string
  url: string
  notes: string
  greinId: string
  runIds: string[]
}

function draftFromLauf(lauf: FjallLaufView | null): LaufDraft {
  return {
    title: lauf?.title ?? '',
    url: lauf?.url ?? '',
    notes: lauf?.notes ?? '',
    greinId: lauf?.greinId ?? '',
    runIds: lauf?.runir.map((run) => run.id) ?? [],
  }
}

export function LaufInspector({
  lauf,
  isNew,
  greinar,
  runir,
  onClose,
  onSave,
  onDelete,
  isSaving,
  runPickerInitialPath,
  defaultRunIds,
  lockedGreinId,
  showBack = false,
}: {
  lauf: FjallLaufView | null
  isNew: boolean
  greinar: FjallGreinView[]
  runir: FjallRunView[]
  onClose: () => void
  onSave: (draft: LaufDraft) => Promise<void>
  onDelete: () => Promise<void>
  isSaving: boolean
  runPickerInitialPath?: string[]
  /** Applied once when creating a new lauf and no runir are set yet. */
  defaultRunIds?: string[]
  /** When set, Grein is fixed to this grein and the selector is hidden. */
  lockedGreinId?: string
  showBack?: boolean
}) {
  const terms = useTerms()
  const [draft, setDraft] = useState<LaufDraft>(() => {
    const initial = draftFromLauf(lauf)
    const withGrein = lockedGreinId ? { ...initial, greinId: lockedGreinId } : initial
    if (isNew && defaultRunIds?.length && withGrein.runIds.length === 0) {
      return { ...withGrein, runIds: defaultRunIds }
    }
    return withGrein
  })
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [fetchingMeta, setFetchingMeta] = useState(false)

  useEffect(() => {
    const next = draftFromLauf(lauf)
    const withGrein = lockedGreinId ? { ...next, greinId: lockedGreinId } : next
    if (isNew && defaultRunIds?.length && withGrein.runIds.length === 0) {
      setDraft({ ...withGrein, runIds: defaultRunIds })
      return
    }
    setDraft(withGrein)
  }, [lauf, isNew, defaultRunIds, lockedGreinId])

  const lockedGrein = lockedGreinId
    ? (greinar.find((grein) => grein.id === lockedGreinId) ?? null)
    : null

  async function handleUrlBlur() {
    const url = draft.url.trim()
    if (!url || draft.title.trim()) return
    setFetchingMeta(true)
    try {
      const meta = await fetchFjallLaufMeta(url)
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

  function setRunIds(runIds: string[]) {
    setDraft((current) => ({ ...current, runIds }))
  }

  const rawRunir = runir.map((run) => ({
    id: run.id,
    name: run.name,
    color: run.color,
    icon: run.icon,
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

        {lockedGreinId ? (
          <div className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{terms.greinar}</span>
            <p className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm text-foreground">
              {lockedGrein?.name ?? terms.audrGroup}
            </p>
          </div>
        ) : (
          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{terms.greinar}</span>
            <Select
              value={draft.greinId}
              onChange={(greinId) => setDraft({ ...draft, greinId })}
              placeholder={terms.unassigned}
              options={[
                { value: '', label: terms.unassigned },
                ...greinar.map((grein) => ({ value: grein.id, label: grein.name })),
              ]}
            />
          </label>
        )}

        {runir.length > 0 ? (
          <label className="block min-w-0 space-y-1.5">
            <span className="text-xs font-medium text-muted-foreground">{terms.runir}</span>
            <RunPicker
              runir={rawRunir}
              selected={draft.runIds}
              onChange={setRunIds}
              placeholder={`Select ${terms.runir.toLowerCase()}`}
              initialPath={runPickerInitialPath}
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
        description={`Delete "${lauf?.title || lauf?.url}"?`}
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

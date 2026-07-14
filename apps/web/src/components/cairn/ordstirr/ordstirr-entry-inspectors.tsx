import type {
  ManifestCompanion,
  ManifestExpedition,
  ManifestGear,
  ManifestLandmark,
  ManifestPathfinding,
  ManifestSummit,
  ManifestTraining,
} from '@/lib/manifest-api'
import {
  deleteManifestCompanion,
  deleteManifestExpedition,
  deleteManifestGear,
  deleteManifestLandmark,
  deleteManifestPathfinding,
  deleteManifestSummit,
  deleteManifestTraining,
  saveManifestCompanion,
  saveManifestExpedition,
  saveManifestGear,
  saveManifestLandmark,
  saveManifestPathfinding,
  saveManifestSummit,
  saveManifestTraining,
} from '@/lib/manifest-api'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { ContextTabButton } from '@/components/core/ui/context-tab'
import { SwitchField } from '@/components/core/ui/switch-field'
import { useTerminology } from '@/hooks/use-terminology'
import { getManifestTerms } from '@/lib/manifest-terminology'
import {
  ManifestDateRangeFields,
  ManifestGearLevelField,
  ManifestMonthField,
  ManifestPlainTextareaField,
  ManifestTextField,
} from './ordstirr-entry-fields'
import { OrdstirrCompanionPhotosPanel } from './ordstirr-companion-photos-panel'
import { createDraftId, OrdstirrManifestListInspector } from './ordstirr-manifest-list-inspector'

type ListInspectorProps<T extends { id: string }> = {
  items: T[]
  selectedId: string | null
  creating: boolean
  onChange: (items: T[]) => void
  onSelect: (id: string | null) => void
  onCreatingChange: (creating: boolean) => void
  onSaved: () => void
}

function draftIdSave<T extends { id: string }>(item: T) {
  return item.id.startsWith('draft-') ? undefined : item.id
}

function useOrdstirrTerms() {
  const { terminology } = useTerminology()
  return getManifestTerms(terminology)
}

export function OrdstirrSummitInspector(props: ListInspectorProps<ManifestSummit>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.summits}
      helpKind="notes"
      deleteTitle={`Delete ${terms.summits}?`}
      deleteDescription={`This ${terms.summits.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        title: '',
        issuer: null,
        date: null,
        description: null,
        url: null,
      })}
      canSave={(item) => Boolean(item.title.trim())}
      saveItem={(item) =>
        saveManifestSummit({
          id: draftIdSave(item),
          title: item.title.trim(),
          issuer: item.issuer,
          date: item.date,
          description: item.description,
          url: item.url,
        })
      }
      deleteItem={deleteManifestSummit}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Title"
            value={item.title}
            onChange={(title) => update({ title })}
            placeholder={`${terms.summits} title`}
          />
          <ManifestTextField
            label="Issuer"
            value={item.issuer ?? ''}
            onChange={(issuer) => update({ issuer: issuer || null })}
          />
          <ManifestMonthField
            label="Date"
            value={item.date}
            onChange={(date) => update({ date })}
          />
          <ManifestTextField
            label="URL"
            value={item.url ?? ''}
            onChange={(url) => update({ url: url || null })}
            placeholder="https://…"
          />
          <ManifestPlainTextareaField
            label="Description"
            value={item.description}
            onChange={(description) => update({ description })}
            placeholder={`Details about this ${terms.summits.toLowerCase()} entry…`}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrExpeditionInspector(props: ListInspectorProps<ManifestExpedition>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.expeditions}
      helpKind="metadata"
      deleteTitle={`Delete ${terms.expeditions}?`}
      deleteDescription={`This ${terms.expeditions.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        title: '',
        company: '',
        location: null,
        startDate: new Date().toISOString(),
        endDate: null,
        current: false,
        description: null,
      })}
      canSave={(item) => Boolean(item.title.trim() && item.company.trim() && item.startDate)}
      saveItem={(item) =>
        saveManifestExpedition({
          id: draftIdSave(item),
          title: item.title.trim(),
          company: item.company.trim(),
          location: item.location,
          startDate: item.startDate,
          endDate: item.endDate,
          current: item.current,
          description: item.description,
        })
      }
      deleteItem={deleteManifestExpedition}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Title"
            value={item.title}
            onChange={(title) => update({ title })}
            placeholder={`${terms.expeditions} title`}
          />
          <ManifestTextField
            label="Company"
            value={item.company}
            onChange={(company) => update({ company })}
          />
          <ManifestTextField
            label={terms.location}
            value={item.location ?? ''}
            onChange={(location) => update({ location: location || null })}
          />
          <ManifestDateRangeFields
            startDate={item.startDate}
            endDate={item.endDate}
            current={item.current}
            onStartDateChange={(startDate) => update({ startDate })}
            onEndDateChange={(endDate) => update({ endDate })}
            onCurrentChange={(current) => update({ current, endDate: current ? null : item.endDate })}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrTrainingInspector(props: ListInspectorProps<ManifestTraining>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.training}
      helpKind="notes"
      deleteTitle={`Delete ${terms.training}?`}
      deleteDescription={`This ${terms.training.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        institution: '',
        degree: null,
        field: null,
        startDate: new Date().toISOString(),
        endDate: null,
        current: false,
        description: null,
      })}
      canSave={(item) => Boolean(item.institution.trim() && item.startDate)}
      saveItem={(item) =>
        saveManifestTraining({
          id: draftIdSave(item),
          institution: item.institution.trim(),
          degree: item.degree,
          field: item.field,
          startDate: item.startDate,
          endDate: item.endDate,
          current: item.current,
          description: item.description,
        })
      }
      deleteItem={deleteManifestTraining}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Institution"
            value={item.institution}
            onChange={(institution) => update({ institution })}
          />
          <ManifestTextField
            label="Degree"
            value={item.degree ?? ''}
            onChange={(degree) => update({ degree: degree || null })}
          />
          <ManifestTextField
            label="Field"
            value={item.field ?? ''}
            onChange={(field) => update({ field: field || null })}
          />
          <ManifestDateRangeFields
            startDate={item.startDate}
            endDate={item.endDate}
            current={item.current}
            onStartDateChange={(startDate) => update({ startDate })}
            onEndDateChange={(endDate) => update({ endDate })}
            onCurrentChange={(current) => update({ current, endDate: current ? null : item.endDate })}
          />
          <ManifestPlainTextareaField
            label="Notes"
            value={item.description}
            onChange={(description) => update({ description })}
            placeholder={`${terms.training} notes…`}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrGearInspector(props: ListInspectorProps<ManifestGear>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.gear}
      helpKind="metadata"
      deleteTitle={`Delete ${terms.gear}?`}
      deleteDescription={`This ${terms.gear.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        name: '',
        category: null,
        level: null,
      })}
      canSave={(item) => Boolean(item.name.trim())}
      saveItem={(item) =>
        saveManifestGear({
          id: draftIdSave(item),
          name: item.name.trim(),
          category: item.category,
          level: item.level,
        })
      }
      deleteItem={deleteManifestGear}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Name"
            value={item.name}
            onChange={(name) => update({ name })}
            placeholder={`${terms.gear} name`}
          />
          <ManifestTextField
            label="Category"
            value={item.category ?? ''}
            onChange={(category) => update({ category: category || null })}
            placeholder="e.g. Languages"
          />
          <ManifestGearLevelField
            value={item.level}
            onChange={(level) => update({ level })}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrLandmarkInspector(props: ListInspectorProps<ManifestLandmark>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.landmarks}
      helpKind="metadata"
      deleteTitle={`Delete ${terms.landmarks}?`}
      deleteDescription={`This ${terms.landmarks.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        name: '',
        description: null,
        url: null,
        githubUrl: null,
        startDate: null,
        endDate: null,
        current: false,
      })}
      canSave={(item) => Boolean(item.name.trim())}
      saveItem={(item) =>
        saveManifestLandmark({
          id: draftIdSave(item),
          name: item.name.trim(),
          description: item.description,
          url: item.url,
          githubUrl: item.githubUrl,
          startDate: item.startDate,
          endDate: item.endDate,
          current: item.current,
        })
      }
      deleteItem={deleteManifestLandmark}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Name"
            value={item.name}
            onChange={(name) => update({ name })}
            placeholder={`${terms.landmarks} name`}
          />
          <ManifestTextField
            label="URL"
            value={item.url ?? ''}
            onChange={(url) => update({ url: url || null })}
            placeholder="https://…"
          />
          <ManifestTextField
            label="GitHub URL"
            value={item.githubUrl ?? ''}
            onChange={(githubUrl) => update({ githubUrl: githubUrl || null })}
            placeholder="https://github.com/…"
          />
          <ManifestDateRangeFields
            startDate={item.startDate ?? new Date().toISOString()}
            endDate={item.endDate}
            current={item.current}
            onStartDateChange={(startDate) => update({ startDate })}
            onEndDateChange={(endDate) => update({ endDate })}
            onCurrentChange={(current) => update({ current, endDate: current ? null : item.endDate })}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrPathfindingInspector(props: ListInspectorProps<ManifestPathfinding>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.pathfinding}
      helpKind="metadata"
      deleteTitle={`Delete ${terms.pathfinding}?`}
      deleteDescription={`This ${terms.pathfinding.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        organization: '',
        role: null,
        location: null,
        startDate: new Date().toISOString(),
        endDate: null,
        current: false,
        description: null,
      })}
      canSave={(item) => Boolean(item.organization.trim() && item.startDate)}
      saveItem={(item) =>
        saveManifestPathfinding({
          id: draftIdSave(item),
          organization: item.organization.trim(),
          role: item.role,
          location: item.location,
          startDate: item.startDate,
          endDate: item.endDate,
          current: item.current,
          description: item.description,
        })
      }
      deleteItem={deleteManifestPathfinding}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Organization"
            value={item.organization}
            onChange={(organization) => update({ organization })}
          />
          <ManifestTextField
            label="Role"
            value={item.role ?? ''}
            onChange={(role) => update({ role: role || null })}
          />
          <ManifestTextField
            label={terms.location}
            value={item.location ?? ''}
            onChange={(location) => update({ location: location || null })}
          />
          <ManifestDateRangeFields
            startDate={item.startDate}
            endDate={item.endDate}
            current={item.current}
            onStartDateChange={(startDate) => update({ startDate })}
            onEndDateChange={(endDate) => update({ endDate })}
            onCurrentChange={(current) => update({ current, endDate: current ? null : item.endDate })}
          />
        </>
      )}
      {...props}
    />
  )
}

export function OrdstirrCompanionInspector({
  items,
  selectedId,
  creating,
  onChange,
  onSelect,
  onCreatingChange,
  onSaved,
}: ListInspectorProps<ManifestCompanion>) {
  const terms = useOrdstirrTerms()
  const [tab, setTab] = useState<'details' | 'photos'>('details')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const savedSnapshotRef = useRef<string | null>(null)

  const emptyItem = (): ManifestCompanion => ({
    id: createDraftId(),
    name: '',
    species: '',
    breed: null,
    birthday: null,
    bio: null,
    passed: false,
    media: [],
  })

  const selected = creating
    ? items.find((item) => item.id === selectedId) ?? emptyItem()
    : selectedId
      ? items.find((item) => item.id === selectedId) ?? null
      : null

  const canSave = (item: ManifestCompanion) => Boolean(item.name.trim() && item.species.trim())
  const isDraft = Boolean(selected?.id.startsWith('draft-'))

  useEffect(() => {
    setTab('details')
  }, [selectedId, creating])

  useEffect(() => {
    if (!selected) {
      savedSnapshotRef.current = null
      return
    }
    savedSnapshotRef.current = JSON.stringify({
      name: selected.name,
      species: selected.species,
      breed: selected.breed,
      birthday: selected.birthday,
      bio: selected.bio,
      passed: selected.passed,
    })
  }, [selectedId, creating])

  useEffect(() => {
    if (!selected || !canSave(selected)) return
    if (creating && !items.some((item) => item.id === selected.id)) return

    const snapshot = JSON.stringify({
      name: selected.name,
      species: selected.species,
      breed: selected.breed,
      birthday: selected.birthday,
      bio: selected.bio,
      passed: selected.passed,
    })
    if (savedSnapshotRef.current === snapshot) return

    const timer = window.setTimeout(() => {
      setSaving(true)
      void saveManifestCompanion({
        id: draftIdSave(selected),
        name: selected.name.trim(),
        species: selected.species.trim(),
        breed: selected.breed ?? null,
        birthday: selected.birthday ?? null,
        bio: selected.bio ?? null,
        passed: selected.passed ?? false,
      })
        .then(() => {
          savedSnapshotRef.current = snapshot
          onSaved()
          toast.success('Saved')
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : `Failed to save ${terms.companions}`)
        })
        .finally(() => setSaving(false))
    }, 700)

    return () => window.clearTimeout(timer)
  }, [creating, items, onSaved, selected, terms.companions])

  function updateSelected(patch: Partial<ManifestCompanion>) {
    if (!selected) return
    if (creating && !items.some((item) => item.id === selected.id)) {
      onChange([...items, { ...selected, ...patch }])
      onSelect(selected.id)
      return
    }
    onChange(items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item)))
  }

  async function handleDelete() {
    if (!selected || isDraft) {
      onCreatingChange(false)
      onSelect(null)
      setDeleteOpen(false)
      return
    }
    setSaving(true)
    try {
      await deleteManifestCompanion(selected.id)
      onChange(items.filter((item) => item.id !== selected.id))
      onSelect(null)
      onSaved()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to delete ${terms.companions}`)
    } finally {
      setSaving(false)
      setDeleteOpen(false)
    }
  }

  if (!selected) {
    return (
      <div className="flex h-full flex-col">
        <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Inspector">
          <ContextTabButton active className="flex-1 justify-center text-xs" disabled>
            Details
          </ContextTabButton>
          <ContextTabButton active={false} className="flex-1 justify-center text-xs" disabled>
            Photos
          </ContextTabButton>
        </nav>
        <div className="flex flex-1 items-center justify-center px-5 text-center text-sm text-muted-foreground">
          Select an entry on the canvas to edit.
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Inspector">
        <ContextTabButton
          active={tab === 'details'}
          onClick={() => setTab('details')}
          className="flex-1 justify-center text-xs"
        >
          Details
        </ContextTabButton>
        <ContextTabButton
          active={tab === 'photos'}
          onClick={() => setTab('photos')}
          className="flex-1 justify-center text-xs"
        >
          Photos
        </ContextTabButton>
      </nav>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-4">
        {tab === 'details' ? (
          <>
            <div>
              <p className="truncate text-sm font-semibold text-foreground">
                {creating || isDraft
                  ? `New ${terms.companions}`
                  : selected.name || `Edit ${terms.companions}`}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Edit descriptions on the canvas. Metadata fields save here.
              </p>
            </div>
            <ManifestTextField
              label="Name"
              value={selected.name}
              onChange={(name) => updateSelected({ name })}
              placeholder={`${terms.companions} name`}
            />
            <ManifestTextField
              label="Species"
              value={selected.species}
              onChange={(species) => updateSelected({ species })}
            />
            <ManifestTextField
              label="Breed"
              value={selected.breed ?? ''}
              onChange={(breed) => updateSelected({ breed: breed || null })}
            />
            <ManifestMonthField
              label="Birthday"
              value={selected.birthday ?? null}
              onChange={(birthday) => updateSelected({ birthday })}
            />
            <SwitchField
              label="Passed"
              checked={selected.passed ?? false}
              onCheckedChange={(passed) => updateSelected({ passed })}
            />
          </>
        ) : (
          <OrdstirrCompanionPhotosPanel
            companionId={selected.id}
            name={selected.name || terms.companions}
            media={selected.media ?? []}
            disabled={isDraft || creating}
            onMediaChange={(media) => updateSelected({ media })}
          />
        )}
      </div>

      {!creating || saving ? (
        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-4">
          {saving && tab === 'details' ? (
            <p className="text-center text-xs text-muted-foreground">Saving…</p>
          ) : null}
          {!creating && !isDraft ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full border-destructive/40 text-destructive hover:bg-destructive/10"
              onClick={() => setDeleteOpen(true)}
            >
              Delete
            </Button>
          ) : null}
        </div>
      ) : null}

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${terms.companions}?`}
        description={`This ${terms.companions.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onCancel={() => setDeleteOpen(false)}
        onConfirm={() => void handleDelete()}
      />
    </div>
  )
}

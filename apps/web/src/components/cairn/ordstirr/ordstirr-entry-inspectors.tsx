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
import { useTerminology } from '@/hooks/use-terminology'
import { getManifestTerms } from '@/lib/manifest-terminology'
import {
  ManifestDateRangeFields,
  ManifestGearLevelField,
  ManifestMonthField,
  ManifestPlainTextareaField,
  ManifestTextField,
} from './ordstirr-entry-fields'
import { createDraftId, OrdstirrManifestListInspector } from './ordstirr-manifest-list-inspector'
import { SwitchField } from '@/components/core/ui/switch-field'

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

export function OrdstirrCompanionInspector(props: ListInspectorProps<ManifestCompanion>) {
  const terms = useOrdstirrTerms()
  return (
    <OrdstirrManifestListInspector
      sectionLabel={terms.companions}
      helpKind="metadata"
      deleteTitle={`Delete ${terms.companions}?`}
      deleteDescription={`This ${terms.companions.toLowerCase()} entry will be removed from your ${terms.manifest.toLowerCase()}.`}
      emptyItem={() => ({
        id: createDraftId(),
        name: '',
        species: '',
        breed: null,
        birthday: null,
        bio: null,
        passed: false,
        media: [],
      })}
      canSave={(item) => Boolean(item.name.trim() && item.species.trim())}
      saveItem={(item) =>
        saveManifestCompanion({
          id: draftIdSave(item),
          name: item.name.trim(),
          species: item.species.trim(),
          breed: item.breed ?? null,
          birthday: item.birthday ?? null,
          bio: item.bio ?? null,
          passed: item.passed ?? false,
        })
      }
      deleteItem={deleteManifestCompanion}
      renderFields={(item, update) => (
        <>
          <ManifestTextField
            label="Name"
            value={item.name}
            onChange={(name) => update({ name })}
            placeholder={`${terms.companions} name`}
          />
          <ManifestTextField
            label="Species"
            value={item.species}
            onChange={(species) => update({ species })}
          />
          <ManifestTextField
            label="Breed"
            value={item.breed ?? ''}
            onChange={(breed) => update({ breed: breed || null })}
          />
          <ManifestMonthField
            label="Birthday"
            value={item.birthday ?? null}
            onChange={(birthday) => update({ birthday })}
          />
          <SwitchField
            label="Passed"
            checked={item.passed ?? false}
            onCheckedChange={(passed) => update({ passed })}
          />
        </>
      )}
      {...props}
    />
  )
}

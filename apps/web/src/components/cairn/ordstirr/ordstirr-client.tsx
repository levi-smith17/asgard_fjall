import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { OrdstirrPageSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import { fetchCairnFullSettings, fetchCairnStatus } from '@/lib/cairn-api'
import { getManifestTerms } from '@/lib/manifest-terminology'
import { useTerminology } from '@/hooks/use-terminology'
import {
  fetchManifest,
  saveManifestOrigins,
  type ManifestData,
  type ManifestOrigins,
} from '@/lib/manifest-api'
import {
  buildJourneySections,
  buildOrdstirrSections,
  manifestPublicJourneyUrl,
  manifestPublicUrl,
  type OrdstirrCanvasView,
  type OrdstirrJourneySectionId,
  type OrdstirrSectionId,
} from '@/lib/ordstirr-format'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { OrdstirrCanvas } from './ordstirr-canvas'
import { OrdstirrContextBar } from './ordstirr-context-bar'
import {
  OrdstirrCompanionInspector,
  OrdstirrExpeditionInspector,
  OrdstirrGearInspector,
  OrdstirrLandmarkInspector,
  OrdstirrPathfindingInspector,
  OrdstirrSummitInspector,
  OrdstirrTrainingInspector,
} from './ordstirr-entry-inspectors'
import { OrdstirrJourneyCanvas } from './ordstirr-journey-canvas'
import { OrdstirrOriginsInspector } from './ordstirr-origins-inspector'
import { OrdstirrRichTextProvider } from './ordstirr-rich-text-context'
import { OrdstirrSectionsRail } from './ordstirr-sections-rail'
import { flushAllManifestPatchSaves } from './ordstirr-manifest-patch'
import {
  createDraftId,
  createEmptyCompanion,
  createEmptyManifestEntry,
  isDraftEntryId,
  JOURNEY_ADD_SECTIONS,
  MANIFEST_ADD_SECTIONS,
} from './ordstirr-empty-entries'

const emptyOrigins = (): ManifestOrigins => ({
  headline: null,
  summary: null,
  bio: null,
  location: null,
  website: null,
  linkedin: null,
  github: null,
})

function serializeOrigins(origins: ManifestOrigins | null | undefined) {
  return JSON.stringify(origins ?? emptyOrigins())
}

const LIST_SECTIONS = new Set<OrdstirrSectionId>([
  'expeditions',
  'training',
  'gear',
  'landmarks',
  'summits',
  'pathfinding',
])

const MANIFEST_SECTIONS = new Set<OrdstirrSectionId>([
  'origins',
  'expeditions',
  'training',
  'gear',
  'landmarks',
  'summits',
  'pathfinding',
])

const JOURNEY_SECTIONS = new Set<OrdstirrJourneySectionId>(['bio', 'companions', 'in-memoriam'])

export function OrdstirrWorkspace() {
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [inspectorEngaged, setInspectorEngaged] = useState(false)
  const [saving, setSaving] = useState(false)
  const [canvasView, setCanvasView] = useState<OrdstirrCanvasView>('manifest')
  const [activeManifestSection, setActiveManifestSection] = useState<OrdstirrSectionId>('origins')
  const [activeJourneySection, setActiveJourneySection] = useState<OrdstirrJourneySectionId>('bio')
  const [selectedEntryId, setSelectedEntryId] = useState<string | null>(null)
  const [creatingEntry, setCreatingEntry] = useState(false)
  const [draft, setDraft] = useState<ManifestData | null>(null)
  const { terminology } = useTerminology()
  const manifestSectionRefs = useRef<Partial<Record<OrdstirrSectionId, HTMLElement | null>>>({})
  const journeySectionRefs = useRef<Partial<Record<OrdstirrJourneySectionId, HTMLElement | null>>>({})
  const originsSaveTimer = useRef<number | null>(null)
  const savedOriginsJson = useRef('')

  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
    staleTime: 60_000,
  })

  const settingsQuery = useQuery({
    queryKey: ['cairn-full-settings'],
    queryFn: fetchCairnFullSettings,
    enabled: statusQuery.data?.configured === true,
  })

  const manifestQuery = useQuery({
    queryKey: ['cairn-manifest'],
    queryFn: fetchManifest,
    enabled: statusQuery.data?.configured === true,
  })

  const username = draft?.username ?? settingsQuery.data?.account.username ?? null

  useEffect(() => {
    if (!manifestQuery.data) return
    const origins = manifestQuery.data.origins ?? emptyOrigins()
    savedOriginsJson.current = serializeOrigins(origins)
    setDraft({
      ...manifestQuery.data,
      origins,
    })
  }, [manifestQuery.data])

  useEffect(() => {
    if (!draft) return
    const view = searchParams.get('view')
    const section = searchParams.get('section')
    const entry = searchParams.get('entry')

    if (view === 'journey') {
      const journeySection = section as OrdstirrJourneySectionId | null
      if (!journeySection || !JOURNEY_SECTIONS.has(journeySection)) return
      setCanvasView('journey')
      setActiveJourneySection(journeySection)
      if (entry) {
        setSelectedEntryId(entry)
        setInspectorEngaged(true)
      }
      return
    }

    const manifestSection = section as OrdstirrSectionId | null
    if (!manifestSection || !MANIFEST_SECTIONS.has(manifestSection)) return
    setCanvasView('manifest')
    setActiveManifestSection(manifestSection)
    if (entry) {
      setSelectedEntryId(entry)
      setInspectorEngaged(true)
    }
  }, [draft, searchParams])

  const terms = useMemo(() => getManifestTerms(terminology), [terminology])

  const configured = statusQuery.data?.configured === true
  const loading =
    statusQuery.isLoading ||
    (configured && (manifestQuery.isLoading || settingsQuery.isLoading))

  const publicUrl = manifestPublicUrl(username, settingsQuery.data?.account.customDomain)
  const publicJourneyUrl = manifestPublicJourneyUrl(username, settingsQuery.data?.account.customDomain)

  const manifestSections = useMemo(
    () => (draft ? buildOrdstirrSections(draft, terms) : []),
    [draft, terms],
  )
  const journeySections = useMemo(
    () => (draft ? buildJourneySections(draft, terms) : []),
    [draft, terms],
  )

  const registerManifestSection = useCallback((id: OrdstirrSectionId, node: HTMLElement | null) => {
    manifestSectionRefs.current[id] = node
  }, [])

  const registerJourneySection = useCallback((id: OrdstirrJourneySectionId, node: HTMLElement | null) => {
    journeySectionRefs.current[id] = node
  }, [])

  function removeDraftEntry(entryId: string) {
    setDraft((prev) => {
      if (!prev) return prev
      const without = <T extends { id: string }>(items: T[]) =>
        items.filter((item) => item.id !== entryId)
      return {
        ...prev,
        expeditions: without(prev.expeditions),
        training: without(prev.training),
        gear: without(prev.gear),
        landmarks: without(prev.landmarks),
        summits: without(prev.summits),
        pathfinding: without(prev.pathfinding),
        companions: without(prev.companions),
      }
    })
  }

  function resetEntrySelection() {
    setSelectedEntryId(null)
    setCreatingEntry(false)
  }

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    if (creatingEntry && selectedEntryId && isDraftEntryId(selectedEntryId)) {
      removeDraftEntry(selectedEntryId)
    }
    setInspectorEngaged(false)
    resetEntrySelection()
  }, [creatingEntry, inspectorPinned, selectedEntryId])

  function scrollToManifestSection(sectionId: OrdstirrSectionId, keepSelection = false) {
    setActiveManifestSection(sectionId)
    if (!keepSelection) resetEntrySelection()
    requestAnimationFrame(() => {
      manifestSectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function scrollToJourneySection(sectionId: OrdstirrJourneySectionId, keepSelection = false) {
    setActiveJourneySection(sectionId)
    if (!keepSelection) resetEntrySelection()
    requestAnimationFrame(() => {
      journeySectionRefs.current[sectionId]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    })
  }

  function handleAddManifestEntry(sectionId: OrdstirrSectionId) {
    if (!draft || sectionId === 'origins') return
    const { entry } = createEmptyManifestEntry(sectionId)
    setDraft((prev) => {
      if (!prev) return prev
      switch (sectionId) {
        case 'expeditions':
          return { ...prev, expeditions: [entry as (typeof prev.expeditions)[0], ...prev.expeditions] }
        case 'training':
          return { ...prev, training: [entry as (typeof prev.training)[0], ...prev.training] }
        case 'gear':
          return { ...prev, gear: [entry as (typeof prev.gear)[0], ...prev.gear] }
        case 'landmarks':
          return { ...prev, landmarks: [entry as (typeof prev.landmarks)[0], ...prev.landmarks] }
        case 'summits':
          return { ...prev, summits: [entry as (typeof prev.summits)[0], ...prev.summits] }
        case 'pathfinding':
          return { ...prev, pathfinding: [entry as (typeof prev.pathfinding)[0], ...prev.pathfinding] }
        default:
          return prev
      }
    })
    setCanvasView('manifest')
    setActiveManifestSection(sectionId)
    setSelectedEntryId((entry as { id: string }).id)
    setCreatingEntry(true)
    setInspectorEngaged(true)
    scrollToManifestSection(sectionId, true)
  }

  function handleAddJourneyEntry(sectionId: OrdstirrJourneySectionId) {
    if (!draft || sectionId === 'bio') return
    const passed = sectionId === 'in-memoriam'
    const entry = createEmptyCompanion(createDraftId(), passed)
    setDraft((prev) => (prev ? { ...prev, companions: [entry, ...prev.companions] } : prev))
    setCanvasView('journey')
    setActiveJourneySection(sectionId)
    setSelectedEntryId(entry.id)
    setCreatingEntry(true)
    setInspectorEngaged(true)
    scrollToJourneySection(sectionId, true)
  }

  function invalidateManifest() {
    void queryClient.invalidateQueries({ queryKey: ['cairn-manifest'] })
  }

  function scheduleOriginsSave(origins: ManifestOrigins) {
    const json = serializeOrigins(origins)
    if (json === savedOriginsJson.current) return
    if (originsSaveTimer.current) window.clearTimeout(originsSaveTimer.current)
    originsSaveTimer.current = window.setTimeout(() => {
      void saveManifestOrigins(origins)
        .then(() => {
          savedOriginsJson.current = serializeOrigins(origins)
          invalidateManifest()
          toast.success('Saved')
        })
        .catch((error) => {
          toast.error(error instanceof Error ? error.message : 'Failed to save origins')
        })
    }, 700)
  }

  const originsDirty = useMemo(() => {
    if (!draft) return false
    return serializeOrigins(draft.origins) !== savedOriginsJson.current
  }, [draft])

  async function handleManualSave() {
    if (!draft) return
    setSaving(true)
    try {
      await flushAllManifestPatchSaves()
      if (originsSaveTimer.current) {
        window.clearTimeout(originsSaveTimer.current)
        originsSaveTimer.current = null
      }
      if (originsDirty) {
        const origins = draft.origins ?? emptyOrigins()
        await saveManifestOrigins(origins)
        savedOriginsJson.current = serializeOrigins(origins)
      }
      invalidateManifest()
      toast.success('Saved')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to save manifest')
    } finally {
      setSaving(false)
    }
  }

  const handleManualSaveRef = useRef(handleManualSave)
  handleManualSaveRef.current = handleManualSave

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key === 's') {
        event.preventDefault()
        void handleManualSaveRef.current()
      }
      if (event.key === 'Escape' && !inspectorPinned) {
        dismissInspector()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector, inspectorPinned])

  function handleOriginsChange(origins: ManifestOrigins) {
    setDraft((prev) => (prev ? { ...prev, origins } : prev))
    scheduleOriginsSave(origins)
  }

  function handleManifestSectionSelect(sectionId: OrdstirrSectionId) {
    scrollToManifestSection(sectionId)
    if (sectionId === 'origins' || LIST_SECTIONS.has(sectionId) === false) {
      setInspectorEngaged(true)
      return
    }
    // List sections: canvas holds entries; only open inspector when an entry is selected.
    if (!selectedEntryId) setInspectorEngaged(false)
  }

  function handleJourneySectionSelect(sectionId: OrdstirrJourneySectionId) {
    scrollToJourneySection(sectionId)
    if (sectionId === 'bio') {
      setInspectorEngaged(true)
      return
    }
    if (!selectedEntryId) setInspectorEngaged(false)
  }

  function handleSelectManifestEntry(sectionId: OrdstirrSectionId, entryId: string) {
    if (selectedEntryId === entryId && inspectorEngaged && !inspectorPinned) {
      dismissInspector()
      return
    }
    setCanvasView('manifest')
    setActiveManifestSection(sectionId)
    setSelectedEntryId(entryId)
    setCreatingEntry(isDraftEntryId(entryId))
    setInspectorEngaged(true)
  }

  function handleSelectCompanion(companionId: string) {
    if (selectedEntryId === companionId && inspectorEngaged && !inspectorPinned) {
      dismissInspector()
      return
    }
    setCanvasView('journey')
    setSelectedEntryId(companionId)
    setCreatingEntry(isDraftEntryId(companionId))
    setInspectorEngaged(true)
    const companion = draft?.companions.find((entry) => entry.id === companionId)
    setActiveJourneySection(companion?.passed ? 'in-memoriam' : 'companions')
  }

  function handleCanvasPointerDown(event: React.PointerEvent) {
    if (inspectorPinned) return
    const target = event.target as HTMLElement
    if (
      !target.closest(
        'a, button, input, select, textarea, [data-inspectable], [data-ordstirr-editor], .ProseMirror',
      )
    ) {
      dismissInspector()
    }
  }

  function handleCanvasViewChange(view: OrdstirrCanvasView) {
    if (creatingEntry && selectedEntryId && isDraftEntryId(selectedEntryId)) {
      removeDraftEntry(selectedEntryId)
    }
    setCanvasView(view)
    resetEntrySelection()
    if (view === 'journey') {
      setActiveJourneySection('bio')
    } else {
      setActiveManifestSection('origins')
    }
  }

  const manifestAddSections = useMemo(
    () => manifestSections.filter((section) => MANIFEST_ADD_SECTIONS.includes(section.id)),
    [manifestSections],
  )
  const journeyAddSections = useMemo(
    () => journeySections.filter((section) => JOURNEY_ADD_SECTIONS.includes(section.id)),
    [journeySections],
  )

  const listInspectorProps = {
    selectedId: selectedEntryId,
    creating: creatingEntry,
    onSelect: (id: string | null) => {
      if (
        selectedEntryId &&
        isDraftEntryId(selectedEntryId) &&
        id !== selectedEntryId &&
        creatingEntry
      ) {
        removeDraftEntry(selectedEntryId)
      }
      setSelectedEntryId(id)
    },
    onCreatingChange: (creating: boolean) => {
      if (!creating && selectedEntryId && isDraftEntryId(selectedEntryId)) {
        removeDraftEntry(selectedEntryId)
      }
      setCreatingEntry(creating)
      if (creating) setInspectorEngaged(true)
    },
    onSaved: invalidateManifest,
  }

  const inspectorOpen = (inspectorPinned || inspectorEngaged) && Boolean(draft)
  const inspectorState = inspectorOpen ? 'open' : draft ? 'hint' : 'hidden'

  function renderManifestInspector() {
    if (!draft) return null

    if (activeManifestSection === 'origins') {
      return (
        <OrdstirrOriginsInspector
          origins={draft.origins ?? emptyOrigins()}
          onChange={handleOriginsChange}
        />
      )
    }

    if (!selectedEntryId && !creatingEntry) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Select an entry on the canvas to edit, or use + to add one.
        </div>
      )
    }

    switch (activeManifestSection) {
      case 'expeditions':
        return (
          <OrdstirrExpeditionInspector
            items={draft.expeditions}
            onChange={(expeditions) => setDraft((prev) => (prev ? { ...prev, expeditions } : prev))}
            {...listInspectorProps}
          />
        )
      case 'training':
        return (
          <OrdstirrTrainingInspector
            items={draft.training}
            onChange={(training) => setDraft((prev) => (prev ? { ...prev, training } : prev))}
            {...listInspectorProps}
          />
        )
      case 'gear':
        return (
          <OrdstirrGearInspector
            items={draft.gear}
            onChange={(gear) => setDraft((prev) => (prev ? { ...prev, gear } : prev))}
            {...listInspectorProps}
          />
        )
      case 'landmarks':
        return (
          <OrdstirrLandmarkInspector
            items={draft.landmarks}
            onChange={(landmarks) => setDraft((prev) => (prev ? { ...prev, landmarks } : prev))}
            {...listInspectorProps}
          />
        )
      case 'summits':
        return (
          <OrdstirrSummitInspector
            items={draft.summits}
            onChange={(summits) => setDraft((prev) => (prev ? { ...prev, summits } : prev))}
            {...listInspectorProps}
          />
        )
      case 'pathfinding':
        return (
          <OrdstirrPathfindingInspector
            items={draft.pathfinding}
            onChange={(pathfinding) => setDraft((prev) => (prev ? { ...prev, pathfinding } : prev))}
            {...listInspectorProps}
          />
        )
      default:
        return null
    }
  }

  function renderJourneyInspector() {
    if (!draft) return null
    if (activeJourneySection === 'bio') {
      return (
        <OrdstirrOriginsInspector
          origins={draft.origins ?? emptyOrigins()}
          onChange={handleOriginsChange}
        />
      )
    }
    if (!selectedEntryId && !creatingEntry) {
      return (
        <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
          Select a companion on the canvas to edit, or use + to add one.
        </div>
      )
    }
    return (
      <OrdstirrCompanionInspector
        items={draft.companions}
        onChange={(companions) => setDraft((prev) => (prev ? { ...prev, companions } : prev))}
        {...listInspectorProps}
      />
    )
  }

  return (
    <StudioLayout
      railLabel="Sections"
      contextBar={
        <OrdstirrContextBar
          canvasView={canvasView}
          terms={terms}
          onCanvasViewChange={handleCanvasViewChange}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
          isDirty={originsDirty}
          saving={saving}
          onSave={() => void handleManualSave()}
        />
      }
      rail={
        configured && draft && !loading ? (
          canvasView === 'manifest' ? (
            <OrdstirrSectionsRail
              sections={manifestSections}
              activeSection={activeManifestSection}
              onSelectSection={handleManifestSectionSelect}
              addSections={manifestAddSections}
              onAddSection={handleAddManifestEntry}
              liveUrl={publicUrl}
            />
          ) : (
            <OrdstirrSectionsRail
              sections={journeySections}
              activeSection={activeJourneySection}
              onSelectSection={handleJourneySectionSelect}
              addSections={journeyAddSections}
              onAddSection={handleAddJourneyEntry}
              liveUrl={publicJourneyUrl}
            />
          )
        ) : undefined
      }
      canvas={
        loading ? (
          <OrdstirrPageSkeleton />
        ) : !configured ? (
          <CairnNotConfiguredNotice />
        ) : !draft ? (
          <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
            Unable to load manifest.
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden" onPointerDown={handleCanvasPointerDown}>
            <OrdstirrRichTextProvider>
                {canvasView === 'manifest' ? (
                  <OrdstirrCanvas
                    data={draft}
                    terms={terms}
                    selectedEntryId={selectedEntryId}
                    registerSection={registerManifestSection}
                    onOriginsChange={handleOriginsChange}
                    onSelectEntry={handleSelectManifestEntry}
                    onSectionSelect={handleManifestSectionSelect}
                    onAddEntry={handleAddManifestEntry}
                    onOpenJourney={() => handleCanvasViewChange('journey')}
                    setDraft={setDraft}
                  />
                ) : (
                  <OrdstirrJourneyCanvas
                    data={draft}
                    terms={terms}
                    selectedEntryId={selectedEntryId}
                    registerSection={registerJourneySection}
                    onOriginsChange={handleOriginsChange}
                    onSelectCompanion={handleSelectCompanion}
                    onSectionSelect={handleJourneySectionSelect}
                    onAddEntry={handleAddJourneyEntry}
                    setDraft={setDraft}
                  />
                )}
              </OrdstirrRichTextProvider>
          </div>
        )
      }
      inspectorState={inspectorState}
      inspectorHint={
        canvasView === 'journey'
          ? 'Select a companion to edit, or use + to add one'
          : LIST_SECTIONS.has(activeManifestSection)
            ? 'Select an entry to edit, or use + to add one'
            : 'Select a section to edit details'
      }
      inspector={canvasView === 'manifest' ? renderManifestInspector() : renderJourneyInspector()}
    />
  )
}

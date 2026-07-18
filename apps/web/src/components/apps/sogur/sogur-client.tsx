import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { toast } from 'sonner'
import { RailCatalogSkeleton, SogurCanvasSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import {
  FjallCatalogInspector,
  type FjallCatalogTab,
} from '@/components/apps/catalog-inspector'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import {
  deleteFjallLog,
  deleteFjallSaga,
  fetchFjallLogs,
  fetchFjallMarkers,
  fetchFjallSagas,
  fetchFjallStatus,
  fetchFjallTrails,
  fetchFjallWaypoints,
  reorderFjallSaga,
  saveFjallLog,
  saveFjallSaga,
  type FjallLogView,
  type FjallSagaView,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { toMarkerView, toTrailView, toWaypointView } from '@/lib/data-format'
import { isGreinVisibleOnPage } from '@/lib/grein-visibility'
import {
  buildSogurWorkspace,
  isLegacySagaId,
  thattrPreview,
  thattrSnippet,
  type SogurSagaModel,
} from '@/lib/sogur-format'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { SogurContextBar, SogurDocumentBar } from './sogur-context-bar'
import {
  SogurCreateInspector,
  SogurSagaInspector,
  SogurThattrInspector,
  type SogurCreateDraft,
} from './sogur-inspectors'
import { SogurSagaCanvas } from './sogur-saga-canvas'
import {
  SOGUR_FILTER_ALL,
  SogurRail,
  type SogurRailItem,
  type SogurRailMarker,
} from './sogur-rail'
import { saveActiveSogurThattr, SogurThattrEditor } from './sogur-thattr-editor'

type InspectorMode = 'create-saga' | 'create-thattr' | 'edit-saga' | 'edit-thattr'

type CatalogState = {
  tab: FjallCatalogTab
  selectedId: string | null
  markerPath: string[]
  markerParent: string | null
}

function emptyThattrContent(): string {
  return '<p></p>'
}

function toRailMarkers(
  markers: Array<{ markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }>,
): SogurRailMarker[] {
  return markers.map((entry) => ({
    id: entry.marker.id,
    name: entry.marker.name,
    color: entry.marker.color,
    icon: entry.marker.icon,
  }))
}

export function SogurWorkspace() {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filterQuery, setFilterQuery] = useState('')
  const [greinFilterId, setGreinFilterId] = useState(SOGUR_FILTER_ALL)
  const [runirFilterId, setRunirFilterId] = useState(SOGUR_FILTER_ALL)
  const [creating, setCreating] = useState(false)
  const [savingMeta, setSavingMeta] = useState(false)
  const [inspectorMode, setInspectorMode] = useState<InspectorMode | null>(null)
  const [inspectorEngaged, setInspectorEngaged] = useState(false)
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [catalog, setCatalog] = useState<CatalogState | null>(null)
  const [editorState, setEditorState] = useState({ dirty: false, saving: false })
  const [createDefaultSagaId, setCreateDefaultSagaId] = useState<string | null>(null)
  const [createDraft, setCreateDraft] = useState<SogurCreateDraft | null>(null)

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const logsQuery = useQuery({
    queryKey: ['fjall-logs'],
    queryFn: fetchFjallLogs,
    enabled: statusQuery.data?.configured === true,
  })

  const sagasQuery = useQuery({
    queryKey: ['fjall-sagas'],
    queryFn: fetchFjallSagas,
    enabled: statusQuery.data?.configured === true,
  })

  const trailsQuery = useQuery({
    queryKey: ['fjall-trails'],
    queryFn: fetchFjallTrails,
    enabled: statusQuery.data?.configured === true,
  })

  const markersQuery = useQuery({
    queryKey: ['fjall-markers'],
    queryFn: fetchFjallMarkers,
    enabled: statusQuery.data?.configured === true,
  })

  const waypointsQuery = useQuery({
    queryKey: ['fjall-waypoints'],
    queryFn: fetchFjallWaypoints,
    enabled: statusQuery.data?.configured === true,
  })

  const configured = statusQuery.data?.configured === true
  const logs = logsQuery.data ?? []
  const apiSagas = sagasQuery.data ?? []
  const workspace = useMemo(() => buildSogurWorkspace(apiSagas, logs), [apiSagas, logs])
  const trails = useMemo(
    () => (trailsQuery.data ?? []).map(toTrailView).sort((a, b) => a.name.localeCompare(b.name)),
    [trailsQuery.data],
  )
  /** Greinar visible on Sögur per the per-Grein Page Visibility setting. */
  const visibleTrails = useMemo(
    () => trails.filter((trail) => isGreinVisibleOnPage(trail, 'sogur')),
    [trails],
  )
  const hiddenSogurTrailIds = useMemo(
    () =>
      new Set(
        trails.filter((trail) => !isGreinVisibleOnPage(trail, 'sogur')).map((trail) => trail.id),
      ),
    [trails],
  )
  useEffect(() => {
    if (hiddenSogurTrailIds.has(greinFilterId)) setGreinFilterId(SOGUR_FILTER_ALL)
  }, [greinFilterId, hiddenSogurTrailIds])
  const rawMarkers = markersQuery.data ?? []
  const markers = useMemo(
    () => rawMarkers.map(toMarkerView).sort((a, b) => a.name.localeCompare(b.name)),
    [rawMarkers],
  )
  const runir: SogurRailMarker[] = useMemo(
    () =>
      markers.map((marker) => ({
        id: marker.id,
        name: marker.name,
        color: marker.color,
        icon: marker.icon,
      })),
    [markers],
  )
  const waypoints = waypointsQuery.data ?? []

  const selectedSagaId =
    searchParams.get('saga') ??
    // Legacy Grein-bucket URLs used `book=<trailId>`.
    (searchParams.get('book')
      ? workspace.sagas.find((saga) => saga.trailId === searchParams.get('book'))?.id ?? null
      : null)
  const selectedThattrId = searchParams.get('thattr') ?? searchParams.get('page')

  const selectedSaga = selectedSagaId
    ? workspace.sagas.find((saga) => saga.id === selectedSagaId) ?? null
    : null
  const selectedSagaThaettir = selectedSaga
    ? workspace.logsBySagaId.get(selectedSaga.id) ?? []
    : []
  const selectedThattr = selectedThattrId
    ? logs.find((log) => log.id === selectedThattrId) ?? null
    : null
  const selectedThattrSaga = selectedThattr?.sagaId
    ? workspace.sagas.find((saga) => saga.id === selectedThattr.sagaId) ?? null
    : selectedThattr && selectedSaga && selectedSagaThaettir.some((log) => log.id === selectedThattr.id)
      ? selectedSaga
      : null

  const contextSaga = selectedThattrSaga ?? selectedSaga
  const contextThaettir = contextSaga
    ? (workspace.logsBySagaId.get(contextSaga.id) ?? []).map((log) => ({
        id: log.id,
        title: log.title?.trim() || '(no title)',
      }))
    : []

  const railItems = useMemo((): SogurRailItem[] => {
    const sagaItems: SogurRailItem[] = workspace.sagas
      .filter((saga) => !saga.trailId || !hiddenSogurTrailIds.has(saga.trailId))
      .map((saga) => {
        const sagaLogs = workspace.logsBySagaId.get(saga.id) ?? []
        return {
          id: saga.id,
          kind: 'saga',
          name: saga.name,
          trailId: saga.trailId,
          trailName: saga.trailName,
          markers: toRailMarkers(saga.markers),
          thattrCount: sagaLogs.length,
          firstThattrId: sagaLogs[0]?.id ?? null,
        }
      })
    const standalone: SogurRailItem[] = workspace.standaloneThaettir
      .filter((log) => !log.trailId || !hiddenSogurTrailIds.has(log.trailId))
      .map((log) => ({
        id: log.id,
        kind: 'thattr',
        name: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
        trailId: log.trailId,
        trailName: log.trailName,
        markers: toRailMarkers(log.markers),
        preview: thattrSnippet(log),
      }))
    return [...sagaItems, ...standalone]
  }, [terms.thattrSingular, workspace, hiddenSogurTrailIds])

  const nestedThaettir = useMemo((): SogurRailItem[] => {
    const items: SogurRailItem[] = []
    for (const saga of workspace.sagas) {
      if (saga.trailId && hiddenSogurTrailIds.has(saga.trailId)) continue
      for (const log of workspace.logsBySagaId.get(saga.id) ?? []) {
        items.push({
          id: log.id,
          kind: 'thattr',
          name: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
          trailId: log.trailId ?? saga.trailId,
          trailName: log.trailName ?? saga.trailName,
          markers: toRailMarkers(log.markers),
          preview: thattrSnippet(log),
          sagaName: saga.name,
        })
      }
    }
    return items
  }, [terms.thattrSingular, workspace, hiddenSogurTrailIds])

  const sagaOptions = useMemo(
    () =>
      workspace.sagas.map((saga) => ({
        id: saga.id,
        name: saga.name,
        trailId: saga.trailId,
      })),
    [workspace.sagas],
  )

  const thattrLaufar = useMemo(() => {
    const trailId = selectedThattr?.trailId ?? selectedThattrSaga?.trailId ?? null
    const trailsMap = new Map(trails.map((trail) => [trail.id, trail]))
    return waypoints
      .map((waypoint) => toWaypointView(waypoint, trailsMap))
      .filter((waypoint) => (trailId ? waypoint.trailId === trailId : true))
      .map((waypoint) => ({
        id: waypoint.id,
        title: waypoint.title,
        url: waypoint.url,
        description: waypoint.description,
      }))
  }, [selectedThattr, selectedThattrSaga, trails, waypoints])

  const activeLauf = selectedThattr?.waypointId
    ? thattrLaufar.find((lauf) => lauf.id === selectedThattr.waypointId) ?? null
    : null

  function setSelection(next: { sagaId?: string | null; thattrId?: string | null }) {
    const params = new URLSearchParams(searchParams.toString())
    params.delete('book')
    params.delete('page')
    if (next.sagaId) params.set('saga', next.sagaId)
    else if (next.sagaId === null) params.delete('saga')
    if (next.thattrId) params.set('thattr', next.thattrId)
    else if (next.thattrId === null) params.delete('thattr')
    setSearchParams(params)
    setCatalog(null)
  }

  async function invalidateSogur() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['fjall-logs'] }),
      queryClient.invalidateQueries({ queryKey: ['fjall-sagas'] }),
    ])
  }

  function patchLogCache(log: FjallLogView) {
    queryClient.setQueryData(['fjall-logs'], (prev: FjallLogView[] | undefined) => {
      const list = prev ?? []
      const index = list.findIndex((entry) => entry.id === log.id)
      if (index < 0) return [...list, log]
      const next = [...list]
      next[index] = log
      return next
    })
  }

  function removeLogCache(id: string) {
    queryClient.setQueryData(['fjall-logs'], (prev: FjallLogView[] | undefined) =>
      (prev ?? []).filter((log) => log.id !== id),
    )
  }

  function patchSagaCache(saga: FjallSagaView) {
    queryClient.setQueryData(['fjall-sagas'], (prev: FjallSagaView[] | undefined) => {
      const list = prev ?? []
      const index = list.findIndex((entry) => entry.id === saga.id)
      if (index < 0) return [...list, saga]
      const next = [...list]
      next[index] = saga
      return next
    })
  }

  /** Persist a Grein-bucket synthetic saga as a real SAGA# before attach/reorder. */
  async function materializeSaga(saga: SogurSagaModel): Promise<FjallSagaView> {
    if (!saga.synthetic) {
      return (
        apiSagas.find((entry) => entry.id === saga.id) ?? {
          id: saga.id,
          name: saga.name,
          trailId: saga.trailId,
          trailName: saga.trailName,
          orderedThattrIds: saga.orderedThattrIds,
          markers: saga.markers,
          createdAt: saga.createdAt,
          updatedAt: saga.updatedAt,
        }
      )
    }
    const created = await saveFjallSaga({
      name: saga.name,
      trailId: saga.trailId,
      markerIds: saga.markers.map((marker) => marker.markerId),
    })
    const sagaLogs = workspace.logsBySagaId.get(saga.id) ?? []
    for (const log of sagaLogs) {
      const saved = await saveFjallLog({
        id: log.id,
        title: log.title,
        content: log.content,
        sagaId: created.id,
        trailId: created.trailId,
        waypointId: log.waypointId,
        markerIds: log.markers.map((marker) => marker.markerId),
      })
      patchLogCache(saved)
    }
    if (sagaLogs.length) {
      const reordered = await reorderFjallSaga(
        created.id,
        sagaLogs.map((log) => log.id),
      )
      patchSagaCache(reordered)
      await invalidateSogur()
      return reordered
    }
    patchSagaCache(created)
    await invalidateSogur()
    return created
  }

  function openCreate(kind: 'saga' | 'thattr', defaultSagaId: string | null = null) {
    setCatalog(null)
    setCreateDefaultSagaId(defaultSagaId)
    setCreateDraft(kind === 'thattr' ? { name: '', sagaId: defaultSagaId, markerIds: [] } : null)
    setInspectorMode(kind === 'saga' ? 'create-saga' : 'create-thattr')
    setInspectorEngaged(true)
  }

  function openThattr(sagaId: string | null, thattrId: string) {
    setSelection({ sagaId, thattrId })
    if (inspectorPinned || inspectorEngaged) {
      setInspectorMode('edit-thattr')
      setInspectorEngaged(true)
    }
  }

  function openSagaFromRail(item: SogurRailItem) {
    const count = item.thattrCount ?? 0
    if (count === 1 && item.firstThattrId) {
      openThattr(item.id, item.firstThattrId)
      return
    }
    if (count === 0) {
      setSelection({ sagaId: item.id, thattrId: null })
      openCreate('thattr', item.id)
      return
    }
    setSelection({ sagaId: item.id, thattrId: null })
    if (inspectorPinned || inspectorEngaged) {
      setInspectorMode('edit-saga')
      setInspectorEngaged(true)
    }
  }

  function openInspectSaga(sagaId: string) {
    setSelection({ sagaId, thattrId: null })
    setCatalog(null)
    setInspectorMode('edit-saga')
    setInspectorEngaged(true)
  }

  function openInspectThattr(thattrId: string, sagaId?: string | null) {
    setSelection({ sagaId: sagaId ?? selectedSagaId, thattrId })
    setCatalog(null)
    setInspectorMode('edit-thattr')
    setInspectorEngaged(true)
  }

  function openCatalog() {
    setInspectorMode(null)
    setInspectorEngaged(true)
    setCatalog({ tab: 'greinar', selectedId: null, markerPath: [], markerParent: null })
  }

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    setInspectorEngaged(false)
    setCatalog(null)
    setInspectorMode(null)
    setCreateDraft(null)
  }, [inspectorPinned])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  // Overview is only for Sagas with 2+ Thaettir — bounce single-Thattr Sagas into the Thattr.
  // Keep overview while creating a Thattr or editing Saga metadata.
  useEffect(() => {
    if (!selectedSaga || selectedThattrId) return
    if (inspectorMode === 'create-thattr' || inspectorMode === 'edit-saga') return
    if (selectedSagaThaettir.length !== 1) return
    const onlyId = selectedSagaThaettir[0]?.id
    if (!onlyId) return
    setSelection({ sagaId: selectedSaga.id, thattrId: onlyId })
    // setSelection is intentionally omitted — it closes over current searchParams.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSaga?.id, selectedThattrId, selectedSagaThaettir.length, selectedSagaThaettir[0]?.id, inspectorMode])

  // Keep inspector mode aligned with selection when pinned/engaged.
  useEffect(() => {
    if (catalog || !inspectorEngaged) return
    if (inspectorMode === 'create-saga' || inspectorMode === 'create-thattr') return
    if (selectedThattrId) setInspectorMode('edit-thattr')
    else if (selectedSagaId) setInspectorMode('edit-saga')
  }, [catalog, inspectorEngaged, inspectorMode, selectedSagaId, selectedThattrId])

  async function handleCreate(input: {
    name: string
    trailId: string | null
    markerIds: string[]
    sagaId?: string | null
  }) {
    setCreating(true)
    try {
      if (inspectorMode === 'create-saga') {
        const created = await saveFjallSaga({
          name: input.name,
          trailId: input.trailId,
          markerIds: input.markerIds,
        })
        patchSagaCache(created)
        await invalidateSogur()
        setSelection({ sagaId: created.id, thattrId: null })
        setCreateDefaultSagaId(created.id)
        setCreateDraft({ name: '', sagaId: created.id, markerIds: [] })
        setInspectorMode('create-thattr')
        setInspectorEngaged(true)
        toast.success(`${terms.notesSingular} created`)
        return
      }

      let sagaId = input.sagaId ?? null
      let trailId = input.trailId
      if (sagaId && isLegacySagaId(sagaId)) {
        const legacy = workspace.sagas.find((saga) => saga.id === sagaId)
        if (legacy) {
          const real = await materializeSaga(legacy)
          sagaId = real.id
          trailId = real.trailId
        }
      } else if (sagaId) {
        const saga = workspace.sagas.find((entry) => entry.id === sagaId)
        trailId = saga?.trailId ?? trailId
      }

      const created = await saveFjallLog({
        title: input.name,
        content: emptyThattrContent(),
        sagaId,
        trailId,
        waypointId: null,
        markerIds: input.markerIds,
      })
      patchLogCache(created)
      await invalidateSogur()
      setCreateDraft(null)
      setSelection({ sagaId: created.sagaId, thattrId: created.id })
      setInspectorMode('edit-thattr')
      toast.success(`${terms.thattrSingular} created`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Create failed')
    } finally {
      setCreating(false)
    }
  }

  async function handleSaveSaga(input: {
    name: string
    trailId: string | null
    markerIds: string[]
  }) {
    if (!selectedSaga) return
    setSavingMeta(true)
    try {
      const base = await materializeSaga(selectedSaga)
      const saved = await saveFjallSaga({
        id: base.id,
        name: input.name,
        trailId: input.trailId,
        markerIds: input.markerIds,
      })
      patchSagaCache(saved)
      await invalidateSogur()
      setSelection({ sagaId: saved.id, thattrId: selectedThattrId })
      toast.success(`${terms.notesSingular} saved`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleDeleteSaga() {
    if (!selectedSaga) return
    setSavingMeta(true)
    try {
      if (!selectedSaga.synthetic) {
        await deleteFjallSaga(selectedSaga.id)
      } else {
        // Synthetic Grein buckets: detach by clearing trailId on Thattr.
        for (const log of workspace.logsBySagaId.get(selectedSaga.id) ?? []) {
          const saved = await saveFjallLog({
            id: log.id,
            title: log.title,
            content: log.content,
            sagaId: null,
            trailId: null,
            waypointId: log.waypointId,
            markerIds: log.markers.map((marker) => marker.markerId),
          })
          patchLogCache(saved)
        }
      }
      await invalidateSogur()
      setSelection({ sagaId: null, thattrId: null })
      dismissInspector()
      toast.success(`${terms.notesSingular} deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleReorderSaga(orderedIds: string[]) {
    if (!selectedSaga) return
    const real = await materializeSaga(selectedSaga)
    const saved = await reorderFjallSaga(real.id, orderedIds)
    patchSagaCache(saved)
    await invalidateSogur()
    if (selectedSaga.synthetic) setSelection({ sagaId: real.id, thattrId: selectedThattrId })
  }

  async function handleSaveThattrMeta(input: {
    title: string
    sagaId: string | null
    trailId: string | null
    markerIds: string[]
    waypointId: string | null
  }) {
    if (!selectedThattr) return
    setSavingMeta(true)
    try {
      let sagaId = input.sagaId
      let trailId = input.trailId
      if (sagaId && isLegacySagaId(sagaId)) {
        const legacy = workspace.sagas.find((saga) => saga.id === sagaId)
        if (legacy) {
          const real = await materializeSaga(legacy)
          sagaId = real.id
          trailId = real.trailId
        }
      }
      const saved = await saveFjallLog({
        id: selectedThattr.id,
        title: input.title,
        content: selectedThattr.content,
        sagaId,
        trailId,
        waypointId: input.waypointId,
        markerIds: input.markerIds,
      })
      patchLogCache(saved)
      await invalidateSogur()
      setSelection({ sagaId: saved.sagaId, thattrId: saved.id })
      toast.success(`${terms.thattrSingular} saved`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Save failed')
    } finally {
      setSavingMeta(false)
    }
  }

  async function handleDeleteThattr() {
    if (!selectedThattr) return
    setSavingMeta(true)
    try {
      await deleteFjallLog(selectedThattr.id)
      removeLogCache(selectedThattr.id)
      await invalidateSogur()
      if (selectedThattr.sagaId || selectedSagaId) {
        setSelection({ sagaId: selectedThattr.sagaId ?? selectedSagaId, thattrId: null })
        setInspectorMode('edit-saga')
      } else {
        setSelection({ sagaId: null, thattrId: null })
        dismissInspector()
      }
      toast.success(`${terms.thattrSingular} deleted`)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Delete failed')
    } finally {
      setSavingMeta(false)
    }
  }

  const thattrIndex = contextThaettir.findIndex((thattr) => thattr.id === selectedThattrId)
  const canPrevious = thattrIndex > 0
  const canNext = thattrIndex >= 0 && thattrIndex < contextThaettir.length - 1

  const activeInspectorMode: InspectorMode | null = catalog
    ? null
    : inspectorMode ??
      (inspectorEngaged
        ? selectedThattr
          ? 'edit-thattr'
          : selectedSaga
            ? 'edit-saga'
            : null
        : null)

  const inspectorContentAvailable =
    catalog != null ||
    activeInspectorMode === 'create-saga' ||
    activeInspectorMode === 'create-thattr' ||
    (activeInspectorMode === 'edit-saga' && Boolean(selectedSaga)) ||
    (activeInspectorMode === 'edit-thattr' && Boolean(selectedThattr))

  const inspectorOpen =
    (inspectorPinned || inspectorEngaged || catalog != null) && inspectorContentAvailable
  const inspectorState = inspectorOpen
    ? 'open'
    : inspectorContentAvailable
      ? 'hint'
      : 'hidden'

  const inspectorHint = catalog
    ? `${terms.greinar} & ${terms.runir}`
    : activeInspectorMode === 'create-saga'
      ? `Create a ${terms.notesSingular.toLowerCase()}`
      : activeInspectorMode === 'create-thattr'
        ? `Create a ${terms.thattrSingular.toLowerCase()}`
        : activeInspectorMode === 'edit-thattr'
          ? `Edit ${terms.thattrSingular.toLowerCase()}`
          : `Edit ${terms.notesSingular.toLowerCase()}`

  const loading =
    statusQuery.isLoading ||
    (configured &&
      (logsQuery.isLoading ||
        sagasQuery.isLoading ||
        trailsQuery.isLoading ||
        markersQuery.isLoading ||
        waypointsQuery.isLoading))

  const showingEditor = Boolean(selectedThattr)
  const showingSagaOverview = Boolean(selectedSaga && !selectedThattr)
  const draftThattrForCanvas =
    showingSagaOverview &&
    activeInspectorMode === 'create-thattr' &&
    createDraft &&
    createDraft.sagaId === selectedSaga?.id
      ? {
          id: '__draft-thattr__',
          title: createDraft.name,
          preview: '',
          markers: createDraft.markerIds
            .map((id) => runir.find((marker) => marker.id === id))
            .filter((marker): marker is SogurRailMarker => marker != null),
        }
      : null

  const handleCreateDraftChange = useCallback((draft: SogurCreateDraft) => {
    setCreateDraft(draft)
  }, [])

  return (
    <StudioLayout
      railLabel={terms.notes}
      contextBar={
        <SogurContextBar
          sagaCount={workspace.sagas.length}
          onNewThattr={() => openCreate('thattr', contextSaga?.id ?? null)}
          onNewSaga={() => openCreate('saga')}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
          showInspectorPin={inspectorContentAvailable}
        />
      }
      rail={
        configured && loading ? (
          <RailCatalogSkeleton rows={8} titleWidth="w-16" />
        ) : configured && !loading ? (
          <SogurRail
            items={railItems}
            nestedThaettir={nestedThaettir}
            selectedSagaId={selectedSagaId}
            selectedThattrId={selectedThattrId}
            filterQuery={filterQuery}
            onFilterQueryChange={setFilterQuery}
            greinFilterId={greinFilterId}
            onGreinFilterChange={setGreinFilterId}
            runirFilterId={runirFilterId}
            onRunirFilterChange={setRunirFilterId}
            greinar={visibleTrails.map((trail) => ({ id: trail.id, name: trail.name }))}
            runir={runir}
            onOpenItem={(item) => {
              if (item.kind === 'saga') {
                openSagaFromRail(item)
                return
              }
              const sagaId =
                workspace.sagas.find((saga) =>
                  (workspace.logsBySagaId.get(saga.id) ?? []).some((log) => log.id === item.id),
                )?.id ?? null
              openThattr(sagaId, item.id)
            }}
            onOpenFirstThattr={(sagaId, thattrId) => openThattr(sagaId, thattrId)}
            onAddThattr={(sagaId) => {
              setSelection({ sagaId, thattrId: null })
              openCreate('thattr', sagaId)
            }}
            onInspectItem={(item) => {
              if (item.kind === 'saga') openInspectSaga(item.id)
              else openInspectThattr(item.id)
            }}
            onNewSaga={() => openCreate('saga')}
            onOpenCatalog={openCatalog}
          />
        ) : undefined
      }
      canvas={
        loading ? (
          <SogurCanvasSkeleton />
        ) : !configured ? (
          <DataNotConfiguredNotice />
        ) : (
          <div className="flex min-h-0 w-full flex-1 flex-col overflow-hidden">
            {showingEditor || showingSagaOverview ? (
              <SogurDocumentBar
                sagaName={contextSaga?.name ?? null}
                thattrName={
                  selectedThattr ? selectedThattr.title?.trim() || '(no title)' : null
                }
                thaettir={contextThaettir}
                activeThattrId={selectedThattrId}
                onSelectThattr={(id) =>
                  setSelection({ sagaId: contextSaga?.id ?? selectedSagaId, thattrId: id })
                }
                onPrevious={() => {
                  if (!canPrevious) return
                  const prev = contextThaettir[thattrIndex - 1]
                  setSelection({ sagaId: contextSaga?.id ?? selectedSagaId, thattrId: prev.id })
                }}
                onNext={() => {
                  if (!canNext) return
                  const next = contextThaettir[thattrIndex + 1]
                  setSelection({ sagaId: contextSaga?.id ?? selectedSagaId, thattrId: next.id })
                }}
                canPrevious={canPrevious}
                canNext={canNext}
                onOpenLauf={
                  activeLauf?.url
                    ? () => window.open(activeLauf.url, '_blank', 'noopener')
                    : undefined
                }
                laufLabel={activeLauf?.title ?? null}
                onSave={showingEditor ? () => void saveActiveSogurThattr() : undefined}
                saving={editorState.saving}
                saveDisabled={!editorState.dirty || editorState.saving}
                onInspectThattr={
                  showingEditor && selectedThattr && contextSaga
                    ? () => openInspectThattr(selectedThattr.id, contextSaga.id)
                    : undefined
                }
              />
            ) : null}
            {showingEditor && selectedThattr ? (
              <SogurThattrEditor
                thattr={selectedThattr}
                onSaved={patchLogCache}
                onStateChange={setEditorState}
              />
            ) : showingSagaOverview && selectedSaga ? (
              <SogurSagaCanvas
                thaettir={selectedSagaThaettir.map((log) => ({
                  id: log.id,
                  title: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
                  preview: thattrSnippet(log),
                  markers: toRailMarkers(log.markers),
                }))}
                draftThattr={draftThattrForCanvas}
                onOpenThattr={(id) => setSelection({ sagaId: selectedSaga.id, thattrId: id })}
                onInspectThattr={(id) => openInspectThattr(id, selectedSaga.id)}
                onReorder={handleReorderSaga}
              />
            ) : (
              <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                <p className="text-sm font-medium text-foreground">
                  Select a {terms.notesSingular.toLowerCase()} or {terms.thattrSingular.toLowerCase()}
                </p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  {terms.notes} group ordered {terms.thaettir.toLowerCase()}. Standalone{' '}
                  {terms.thaettir.toLowerCase()} appear on the rail without a{' '}
                  {terms.notesSingular.toLowerCase()}.
                </p>
              </div>
            )}
          </div>
        )
      }
      inspectorState={inspectorState}
      inspectorHint={inspectorHint}
      onDismissInspector={dismissInspector}
      inspector={
        catalog ? (
          <FjallCatalogInspector
            activeTab={catalog.tab}
            onTabChange={(tab) =>
              setCatalog({ tab, selectedId: null, markerPath: [], markerParent: null })
            }
            trails={trails}
            markers={markers}
            selectedId={catalog.selectedId}
            markerPath={catalog.markerPath}
            markerParent={catalog.markerParent}
            onSelectId={(id) =>
              setCatalog((current) => (current ? { ...current, selectedId: id } : current))
            }
            onMarkerPathChange={(path) =>
              setCatalog((current) =>
                current ? { ...current, markerPath: path, selectedId: null } : current,
              )
            }
            onMarkerParentChange={(parent) =>
              setCatalog((current) => (current ? { ...current, markerParent: parent } : current))
            }
            onClearSelection={() =>
              setCatalog((current) =>
                current ? { ...current, selectedId: null, markerParent: null } : current,
              )
            }
          />
        ) : activeInspectorMode === 'create-saga' || activeInspectorMode === 'create-thattr' ? (
          <SogurCreateInspector
            kind={activeInspectorMode === 'create-saga' ? 'saga' : 'thattr'}
            defaultSagaId={createDefaultSagaId}
            sagas={sagaOptions}
            greinar={trails.map((trail) => ({ id: trail.id, name: trail.name }))}
            runir={runir}
            creating={creating}
            onCreate={handleCreate}
            onDraftChange={
              activeInspectorMode === 'create-thattr' ? handleCreateDraftChange : undefined
            }
          />
        ) : activeInspectorMode === 'edit-saga' && selectedSaga ? (
          <SogurSagaInspector
            saga={{
              id: selectedSaga.id,
              name: selectedSaga.name,
              trailId: selectedSaga.trailId,
              markerIds: selectedSaga.markers.map((marker) => marker.markerId),
            }}
            thaettir={selectedSagaThaettir.map((log) => ({
              id: log.id,
              title: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
            }))}
            greinar={trails.map((trail) => ({ id: trail.id, name: trail.name }))}
            runir={runir}
            saving={savingMeta}
            onSave={handleSaveSaga}
            onDelete={() => void handleDeleteSaga()}
            onReorder={handleReorderSaga}
          />
        ) : activeInspectorMode === 'edit-thattr' && selectedThattr ? (
          <SogurThattrInspector
            thattr={{
              id: selectedThattr.id,
              title: selectedThattr.title?.trim() || thattrPreview(selectedThattr),
              sagaId: selectedThattr.sagaId ?? selectedThattrSaga?.id ?? null,
              trailId: selectedThattr.trailId,
              markerIds: selectedThattr.markers.map((marker) => marker.markerId),
              waypointId: selectedThattr.waypointId,
            }}
            sagas={sagaOptions}
            greinar={trails.map((trail) => ({ id: trail.id, name: trail.name }))}
            runir={runir}
            laufar={thattrLaufar}
            saving={savingMeta}
            onSave={handleSaveThattrMeta}
            onDelete={() => void handleDeleteThattr()}
          />
        ) : null
      }
    />
  )
}

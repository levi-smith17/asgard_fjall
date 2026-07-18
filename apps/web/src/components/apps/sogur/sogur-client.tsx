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
  fetchFjallRunir,
  fetchFjallSagas,
  fetchFjallStatus,
  fetchFjallGreinar,
  fetchFjallLaufar,
  reorderFjallSaga,
  saveFjallLog,
  saveFjallSaga,
  type FjallLogView,
  type FjallSagaView,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { toRunView, toGreinView, toLaufView } from '@/lib/data-format'
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
  type SogurRailRun,
} from './sogur-rail'
import { saveActiveSogurThattr, SogurThattrEditor } from './sogur-thattr-editor'

type InspectorMode = 'create-saga' | 'create-thattr' | 'edit-saga' | 'edit-thattr'

type CatalogState = {
  tab: FjallCatalogTab
  selectedId: string | null
  runPath: string[]
  runParent: string | null
}

function emptyThattrContent(): string {
  return '<p></p>'
}

function toRailRunir(
  runir: Array<{ runId: string; run: { id: string; name: string; color: string; icon: string | null } }>,
): SogurRailRun[] {
  return runir.map((entry) => ({
    id: entry.run.id,
    name: entry.run.name,
    color: entry.run.color,
    icon: entry.run.icon,
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

  const greinarQuery = useQuery({
    queryKey: ['fjall-greinar'],
    queryFn: fetchFjallGreinar,
    enabled: statusQuery.data?.configured === true,
  })

  const runirQuery = useQuery({
    queryKey: ['fjall-runir'],
    queryFn: fetchFjallRunir,
    enabled: statusQuery.data?.configured === true,
  })

  const laufarQuery = useQuery({
    queryKey: ['fjall-laufar'],
    queryFn: fetchFjallLaufar,
    enabled: statusQuery.data?.configured === true,
  })

  const configured = statusQuery.data?.configured === true
  const logs = logsQuery.data ?? []
  const apiSagas = sagasQuery.data ?? []
  const workspace = useMemo(() => buildSogurWorkspace(apiSagas, logs), [apiSagas, logs])
  const greinar = useMemo(
    () => (greinarQuery.data ?? []).map(toGreinView).sort((a, b) => a.name.localeCompare(b.name)),
    [greinarQuery.data],
  )
  /** Greinar visible on Sögur per the per-Grein Page Visibility setting. */
  const visibleGreinar = useMemo(
    () => greinar.filter((grein) => isGreinVisibleOnPage(grein, 'sogur')),
    [greinar],
  )
  const hiddenSogurGreinIds = useMemo(
    () =>
      new Set(
        greinar.filter((grein) => !isGreinVisibleOnPage(grein, 'sogur')).map((grein) => grein.id),
      ),
    [greinar],
  )
  useEffect(() => {
    if (hiddenSogurGreinIds.has(greinFilterId)) setGreinFilterId(SOGUR_FILTER_ALL)
  }, [greinFilterId, hiddenSogurGreinIds])
  const rawRunir = runirQuery.data ?? []
  const runir = useMemo(
    () => rawRunir.map(toRunView).sort((a, b) => a.name.localeCompare(b.name)),
    [rawRunir],
  )
  const railRunir: SogurRailRun[] = useMemo(
    () =>
      runir.map((run) => ({
        id: run.id,
        name: run.name,
        color: run.color,
        icon: run.icon,
      })),
    [runir],
  )
  const laufar = laufarQuery.data ?? []

  const selectedSagaId =
    searchParams.get('saga') ??
    // Legacy Grein-bucket URLs used `book=<greinId>`.
    (searchParams.get('book')
      ? workspace.sagas.find((saga) => saga.greinId === searchParams.get('book'))?.id ?? null
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
      .filter((saga) => !saga.greinId || !hiddenSogurGreinIds.has(saga.greinId))
      .map((saga) => {
        const sagaLogs = workspace.logsBySagaId.get(saga.id) ?? []
        return {
          id: saga.id,
          kind: 'saga',
          name: saga.name,
          greinId: saga.greinId,
          greinName: saga.greinName,
          runir: toRailRunir(saga.runir),
          thattrCount: sagaLogs.length,
          firstThattrId: sagaLogs[0]?.id ?? null,
        }
      })
    const standalone: SogurRailItem[] = workspace.standaloneThaettir
      .filter((log) => !log.greinId || !hiddenSogurGreinIds.has(log.greinId))
      .map((log) => ({
        id: log.id,
        kind: 'thattr',
        name: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
        greinId: log.greinId,
        greinName: log.greinName,
        runir: toRailRunir(log.runir),
        preview: thattrSnippet(log),
      }))
    return [...sagaItems, ...standalone]
  }, [terms.thattrSingular, workspace, hiddenSogurGreinIds])

  const nestedThaettir = useMemo((): SogurRailItem[] => {
    const items: SogurRailItem[] = []
    for (const saga of workspace.sagas) {
      if (saga.greinId && hiddenSogurGreinIds.has(saga.greinId)) continue
      for (const log of workspace.logsBySagaId.get(saga.id) ?? []) {
        items.push({
          id: log.id,
          kind: 'thattr',
          name: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
          greinId: log.greinId ?? saga.greinId,
          greinName: log.greinName ?? saga.greinName,
          runir: toRailRunir(log.runir),
          preview: thattrSnippet(log),
          sagaName: saga.name,
        })
      }
    }
    return items
  }, [terms.thattrSingular, workspace, hiddenSogurGreinIds])

  const sagaOptions = useMemo(
    () =>
      workspace.sagas.map((saga) => ({
        id: saga.id,
        name: saga.name,
        greinId: saga.greinId,
      })),
    [workspace.sagas],
  )

  const thattrLaufar = useMemo(() => {
    const greinId = selectedThattr?.greinId ?? selectedThattrSaga?.greinId ?? null
    const greinarMap = new Map(greinar.map((grein) => [grein.id, grein]))
    return laufar
      .map((lauf) => toLaufView(lauf, greinarMap))
      .filter((lauf) => (greinId ? lauf.greinId === greinId : true))
      .map((lauf) => ({
        id: lauf.id,
        title: lauf.title,
        url: lauf.url,
        description: lauf.description,
      }))
  }, [selectedThattr, selectedThattrSaga, greinar, laufar])

  const activeLauf = selectedThattr?.laufId
    ? thattrLaufar.find((lauf) => lauf.id === selectedThattr.laufId) ?? null
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
          greinId: saga.greinId,
          greinName: saga.greinName,
          orderedThattrIds: saga.orderedThattrIds,
          runir: saga.runir,
          createdAt: saga.createdAt,
          updatedAt: saga.updatedAt,
        }
      )
    }
    const created = await saveFjallSaga({
      name: saga.name,
      greinId: saga.greinId,
      runIds: saga.runir.map((run) => run.runId),
    })
    const sagaLogs = workspace.logsBySagaId.get(saga.id) ?? []
    for (const log of sagaLogs) {
      const saved = await saveFjallLog({
        id: log.id,
        title: log.title,
        content: log.content,
        sagaId: created.id,
        greinId: created.greinId,
        laufId: log.laufId,
        runIds: log.runir.map((run) => run.runId),
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
    setCreateDraft(kind === 'thattr' ? { name: '', sagaId: defaultSagaId, runIds: [] } : null)
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
    setCatalog({ tab: 'greinar', selectedId: null, runPath: [], runParent: null })
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
    greinId: string | null
    runIds: string[]
    sagaId?: string | null
  }) {
    setCreating(true)
    try {
      if (inspectorMode === 'create-saga') {
        const created = await saveFjallSaga({
          name: input.name,
          greinId: input.greinId,
          runIds: input.runIds,
        })
        patchSagaCache(created)
        await invalidateSogur()
        setSelection({ sagaId: created.id, thattrId: null })
        setCreateDefaultSagaId(created.id)
        setCreateDraft({ name: '', sagaId: created.id, runIds: [] })
        setInspectorMode('create-thattr')
        setInspectorEngaged(true)
        toast.success(`${terms.notesSingular} created`)
        return
      }

      let sagaId = input.sagaId ?? null
      let greinId = input.greinId
      if (sagaId && isLegacySagaId(sagaId)) {
        const legacy = workspace.sagas.find((saga) => saga.id === sagaId)
        if (legacy) {
          const real = await materializeSaga(legacy)
          sagaId = real.id
          greinId = real.greinId
        }
      } else if (sagaId) {
        const saga = workspace.sagas.find((entry) => entry.id === sagaId)
        greinId = saga?.greinId ?? greinId
      }

      const created = await saveFjallLog({
        title: input.name,
        content: emptyThattrContent(),
        sagaId,
        greinId,
        laufId: null,
        runIds: input.runIds,
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
    greinId: string | null
    runIds: string[]
  }) {
    if (!selectedSaga) return
    setSavingMeta(true)
    try {
      const base = await materializeSaga(selectedSaga)
      const saved = await saveFjallSaga({
        id: base.id,
        name: input.name,
        greinId: input.greinId,
        runIds: input.runIds,
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
        // Synthetic Grein buckets: detach by clearing greinId on Thattr.
        for (const log of workspace.logsBySagaId.get(selectedSaga.id) ?? []) {
          const saved = await saveFjallLog({
            id: log.id,
            title: log.title,
            content: log.content,
            sagaId: null,
            greinId: null,
            laufId: log.laufId,
            runIds: log.runir.map((run) => run.runId),
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
    greinId: string | null
    runIds: string[]
    laufId: string | null
  }) {
    if (!selectedThattr) return
    setSavingMeta(true)
    try {
      let sagaId = input.sagaId
      let greinId = input.greinId
      if (sagaId && isLegacySagaId(sagaId)) {
        const legacy = workspace.sagas.find((saga) => saga.id === sagaId)
        if (legacy) {
          const real = await materializeSaga(legacy)
          sagaId = real.id
          greinId = real.greinId
        }
      }
      const saved = await saveFjallLog({
        id: selectedThattr.id,
        title: input.title,
        content: selectedThattr.content,
        sagaId,
        greinId,
        laufId: input.laufId,
        runIds: input.runIds,
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
        greinarQuery.isLoading ||
        runirQuery.isLoading ||
        laufarQuery.isLoading))

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
          runir: createDraft.runIds
            .map((id) => railRunir.find((run) => run.id === id))
            .filter((run): run is SogurRailRun => run != null),
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
            greinar={visibleGreinar.map((grein) => ({ id: grein.id, name: grein.name }))}
            runir={railRunir}
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
                  runir: toRailRunir(log.runir),
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
              setCatalog({ tab, selectedId: null, runPath: [], runParent: null })
            }
            greinar={greinar}
            runir={runir}
            selectedId={catalog.selectedId}
            runPath={catalog.runPath}
            runParent={catalog.runParent}
            onSelectId={(id) =>
              setCatalog((current) => (current ? { ...current, selectedId: id } : current))
            }
            onRunPathChange={(path) =>
              setCatalog((current) =>
                current ? { ...current, runPath: path, selectedId: null } : current,
              )
            }
            onRunParentChange={(parent) =>
              setCatalog((current) => (current ? { ...current, runParent: parent } : current))
            }
            onClearSelection={() =>
              setCatalog((current) =>
                current ? { ...current, selectedId: null, runParent: null } : current,
              )
            }
          />
        ) : activeInspectorMode === 'create-saga' || activeInspectorMode === 'create-thattr' ? (
          <SogurCreateInspector
            kind={activeInspectorMode === 'create-saga' ? 'saga' : 'thattr'}
            defaultSagaId={createDefaultSagaId}
            sagas={sagaOptions}
            greinar={greinar.map((grein) => ({ id: grein.id, name: grein.name }))}
            runir={railRunir}
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
              greinId: selectedSaga.greinId,
              runIds: selectedSaga.runir.map((run) => run.runId),
            }}
            thaettir={selectedSagaThaettir.map((log) => ({
              id: log.id,
              title: thattrPreview(log, `Untitled ${terms.thattrSingular}`),
            }))}
            greinar={greinar.map((grein) => ({ id: grein.id, name: grein.name }))}
            runir={railRunir}
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
              greinId: selectedThattr.greinId,
              runIds: selectedThattr.runir.map((run) => run.runId),
              laufId: selectedThattr.laufId,
            }}
            sagas={sagaOptions}
            greinar={greinar.map((grein) => ({ id: grein.id, name: grein.name }))}
            runir={railRunir}
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

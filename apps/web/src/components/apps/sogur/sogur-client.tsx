import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { BookOpen } from 'lucide-react'
import { RailCatalogSkeleton, SogurCanvasSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import {
  FjallCatalogInspector,
  type FjallCatalogTab,
} from '@/components/apps/catalog-inspector'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import {
  createFjallTrail,
  fetchFjallLogs,
  fetchFjallMarkers,
  fetchFjallStatus,
  fetchFjallTrails,
  fetchFjallWaypoints,
  saveFjallLog,
  type FjallLogView,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { toMarkerView, toTrailView, toWaypointView } from '@/lib/data-format'
import { groupLogsIntoLogbooks, sortFjallLogs } from '@/lib/sogur-format'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { SogurContextBar } from './sogur-context-bar'
import { SogurLogbook } from './sogur-logbook'
import { SogurNewSagaInspector } from './sogur-new-saga-inspector'
import { SogurPageOrderInspector } from './sogur-page-order-inspector'
import { SogurRail } from './sogur-rail'

type InspectorMode = 'new' | 'reorder'

type CatalogState = {
  tab: FjallCatalogTab
  selectedId: string | null
  markerPath: string[]
  markerParent: string | null
}

export function SogurWorkspace() {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [inspectorMode, setInspectorMode] = useState<InspectorMode | null>(null)
  const [inspectorEngaged, setInspectorEngaged] = useState(false)
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [catalog, setCatalog] = useState<CatalogState | null>(null)

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
  const logbooks = useMemo(() => groupLogsIntoLogbooks(logs), [logs])
  const trails = useMemo(
    () => (trailsQuery.data ?? []).map(toTrailView).sort((a, b) => a.name.localeCompare(b.name)),
    [trailsQuery.data],
  )
  const rawMarkers = markersQuery.data ?? []
  const markers = useMemo(
    () => rawMarkers.map(toMarkerView).sort((a, b) => a.name.localeCompare(b.name)),
    [rawMarkers],
  )
  const waypoints = waypointsQuery.data ?? []

  const usedTrailIds = useMemo(() => new Set(logbooks.map((book) => book.trailId)), [logbooks])
  const availableGreinar = useMemo(
    () => trails.filter((trail) => !usedTrailIds.has(trail.id)),
    [trails, usedTrailIds],
  )

  const selectedBookId = searchParams.get('book')
  const selectedPageId = searchParams.get('page')
  const selectedBook = selectedBookId
    ? logbooks.find((book) => book.id === selectedBookId) ?? null
    : null

  const trailWaypoints = useMemo(() => {
    if (!selectedBook) return []
    const trailsMap = new Map(trails.map((trail) => [trail.id, trail]))
    return waypoints
      .map((waypoint) => toWaypointView(waypoint, trailsMap))
      .filter((waypoint) => waypoint.trailId === selectedBook.trailId)
      .map((waypoint) => ({
        id: waypoint.id,
        title: waypoint.title,
        url: waypoint.url,
        description: waypoint.description,
      }))
  }, [selectedBook, trails, waypoints])

  function selectBook(bookId: string, pageId?: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('book', bookId)
    if (pageId) params.set('page', pageId)
    else params.delete('page')
    setSearchParams(params)
    setCatalog(null)
    if (inspectorPinned || inspectorEngaged) setInspectorMode('reorder')
  }

  function selectPage(pageId: string) {
    if (!selectedBookId) return
    selectBook(selectedBookId, pageId)
  }

  function handleLogsChange(nextBookLogs: FjallLogView[]) {
    if (!selectedBook) return
    queryClient.setQueryData(['fjall-logs'], (prev: FjallLogView[] | undefined) => {
      const others = (prev ?? []).filter((log) => log.trailId !== selectedBook.trailId)
      return [...others, ...nextBookLogs]
    })
  }

  function openNewInspector() {
    setCatalog(null)
    setInspectorMode('new')
    setInspectorEngaged(true)
  }

  function openReorderInspector() {
    setCatalog(null)
    setInspectorMode('reorder')
    setInspectorEngaged(true)
  }

  function openCatalog() {
    setInspectorMode(null)
    setInspectorEngaged(true)
    setCatalog({ tab: 'greinar', selectedId: null, markerPath: [], markerParent: null })
  }

  function handleInspectorPinnedChange(pinned: boolean) {
    setInspectorPinned(pinned)
  }

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    setInspectorEngaged(false)
    setCatalog(null)
    setInspectorMode(null)
  }, [inspectorPinned])

  function handleCanvasPointerDown(event: React.PointerEvent) {
    if (inspectorPinned) return
    const target = event.target as HTMLElement
    if (
      target.closest(
        'a, button, input, select, textarea, [data-inspectable], [data-sogur-editor], .ProseMirror',
      )
    ) {
      return
    }
    dismissInspector()
  }

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  async function handleCreateSaga(input: { trailId?: string; newGreinName?: string }) {
    setCreating(true)
    try {
      let trailId = input.trailId
      if (input.newGreinName) {
        const trail = await createFjallTrail({ name: input.newGreinName })
        trailId = trail.id
        await queryClient.invalidateQueries({ queryKey: ['fjall-trails'] })
      }
      if (!trailId) return

      const created = await saveFjallLog({
        title: null,
        content: '<p></p>',
        trailId,
        markerIds: [],
        waypointId: null,
      })
      await queryClient.invalidateQueries({ queryKey: ['fjall-logs'] })
      setInspectorMode('reorder')
      setInspectorEngaged(true)
      selectBook(trailId, created.id)
    } finally {
      setCreating(false)
    }
  }

  function handleCancelNew() {
    setInspectorMode(selectedBook ? 'reorder' : null)
    if (!selectedBook) setInspectorEngaged(false)
  }

  const bookLogs = selectedBook ? sortFjallLogs(selectedBook.logs) : []
  const activeInspectorMode =
    catalog ? null : inspectorMode ?? (selectedBook && inspectorEngaged ? 'reorder' : null)
  const inspectorContentAvailable =
    catalog != null ||
    activeInspectorMode === 'new' ||
    (activeInspectorMode === 'reorder' && Boolean(selectedBook))
  const inspectorOpen = (inspectorPinned || inspectorEngaged || catalog != null) && inspectorContentAvailable
  const inspectorState = inspectorOpen
    ? 'open'
    : inspectorContentAvailable
      ? 'hint'
      : 'hidden'

  const inspectorHint = catalog
    ? `${terms.greinar} & ${terms.runir}`
    : activeInspectorMode === 'new'
      ? `Open the inspector to create a ${terms.notesSingular.toLowerCase()}`
      : 'Open the inspector to reorder pages'

  const loading =
    statusQuery.isLoading ||
    (configured &&
      (logsQuery.isLoading || trailsQuery.isLoading || markersQuery.isLoading || waypointsQuery.isLoading))

  return (
    <StudioLayout
      railLabel={terms.notes}
      contextBar={
        <SogurContextBar
          sagaCount={logbooks.length}
          onNewSaga={openNewInspector}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={handleInspectorPinnedChange}
          showInspectorPin={inspectorContentAvailable}
        />
      }
      rail={
        configured && loading ? (
          <RailCatalogSkeleton rows={8} titleWidth="w-16" />
        ) : configured && !loading ? (
          <SogurRail
            logbooks={logbooks}
            selectedBookId={selectedBookId}
            search={search}
            onSearchChange={setSearch}
            onSelectBook={selectBook}
            onNew={openNewInspector}
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
          <div
            className="flex min-h-0 w-full flex-1 flex-col overflow-hidden"
            onPointerDown={handleCanvasPointerDown}
          >
            {selectedBook ? (
              <SogurLogbook
                bookId={selectedBook.id}
                bookName={selectedBook.name}
                trailId={selectedBook.trailId}
                initialLogs={bookLogs}
                initialPageId={selectedPageId}
                markers={rawMarkers}
                waypoints={trailWaypoints}
                onLogsChange={handleLogsChange}
                onOpenPageOrder={openReorderInspector}
              />
            ) : (
              <div className="flex w-full flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                  <p className="text-sm font-medium text-foreground">
                    Select a {terms.notesSingular.toLowerCase()}
                  </p>
                  <p className="max-w-sm text-sm text-muted-foreground">
                    Each {terms.notesSingular.toLowerCase()} belongs to a{' '}
                    {terms.greinSingular.toLowerCase()}. Pick one from the rail, or create a new{' '}
                    {terms.notesSingular.toLowerCase()} from the toolbar.
                  </p>
                </div>
              )}
          </div>
        )
      }
      inspectorState={inspectorState}
      inspectorHint={inspectorHint}
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
            onSelectId={(id) => setCatalog((current) => (current ? { ...current, selectedId: id } : current))}
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
        ) : activeInspectorMode === 'new' ? (
          <SogurNewSagaInspector
            greinar={availableGreinar}
            onCancel={handleCancelNew}
            onCreate={handleCreateSaga}
            creating={creating}
          />
        ) : selectedBook ? (
          <SogurPageOrderInspector
            logs={bookLogs}
            activePageId={selectedPageId}
            bookName={selectedBook.name}
            onLogsChange={handleLogsChange}
            onSelectPage={selectPage}
            onClose={dismissInspector}
          />
        ) : null
      }
    />
  )
}

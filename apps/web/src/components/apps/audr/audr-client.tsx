import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import {
  FjallCatalogInspector,
  type FjallCatalogTab,
} from '@/components/apps/catalog-inspector'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { RailCatalogSkeleton, TableSkeleton } from '@/components/core/ui/studio-skeletons'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { useDebounce } from '@/hooks/use-debounce'
import {
  fetchFjallSurtrPage,
  fetchFjallRunir,
  fetchAudrSummary,
  fetchFjallSjodr,
  fetchFjallIdunnFiltered,
  fetchFjallGreinar,
} from '@/lib/data-api'
import { daysUntilRenewal } from '@/lib/idunn-renewal'
import { toRunView, toGreinView } from '@/lib/data-format'
import { isGreinVisibleOnPage } from '@/lib/grein-visibility'
import {
  monthYearLabel,
  shiftMonth,
  type AudrCanvasGroupBy,
} from '@/lib/audr-format'
import { resolveAudrRunRootPath } from '@/lib/audr-run-root'
import { loadAudrCanvasGroupBy, saveAudrCanvasGroupBy } from '@/lib/audr-group-by'
import { totalEffectiveSkattUtilization } from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { AudrContextBar } from './audr-context-bar'
import { AudrIdunnRail } from './audr-idunn-rail'
import { AudrLaufarInspector } from './audr-laufar-inspector'
import { AudrSjodrInspector } from './audr-sjodr-inspector'
import { AudrSurtrCanvas } from './audr-surtr-canvas'
import { AudrInspector } from './audr-inspector'
import type { AudrSelection } from './audr-types'

type CatalogState = {
  tab: FjallCatalogTab
  selectedId: string | null
  runPath: string[]
  runParent: string | null
}

type PanelManageState = {
  selectedId: string | null
}

export function AudrPageSkeleton() {
  const terms = useTerms()
  return (
    <StudioLayout
      railLabel={terms.idunn}
      contextBar={
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
      }
      rail={<RailCatalogSkeleton rows={7} titleWidth="w-16" />}
      canvas={<TableSkeleton rows={10} columns={4} />}
      inspectorState="hint"
      inspectorHint={`Select ${terms.surtr.toLowerCase()}, ${terms.idunn.toLowerCase()}, or ${terms.skatt.toLowerCase()} to inspect`}
    />
  )
}

export function AudrClient() {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const refresh = () => queryClient.invalidateQueries({ queryKey: ['audr'] })
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()

  const now = new Date()
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [year, setYear] = useState(now.getFullYear())
  const [search, setSearch] = useState('')
  const [runFilter, setRunFilter] = useState('all')
  const [sjodrFilter, setSjodrFilter] = useState('all')
  const [groupBy, setGroupBy] = useState<AudrCanvasGroupBy>(() => loadAudrCanvasGroupBy())
  const [idunnActiveFilter, setIdunnActiveFilter] = useState('true')
  const debouncedSearch = useDebounce(search, 300)
  const surtrFiltersActive =
    search !== '' || runFilter !== 'all' || sjodrFilter !== 'all'
  const idunnFiltersActive = idunnActiveFilter !== 'true'

  const [selection, setSelection] = useState<AudrSelection | null>(null)
  const [catalog, setCatalog] = useState<CatalogState | null>(null)
  const [laufarManage, setLaufarManage] = useState<PanelManageState | null>(null)
  const [sjodrManage, setSjodrManage] = useState<PanelManageState | null>(null)
  const [surtrPage, setSurtrPage] = useState(1)

  const runirQuery = useQuery({
    queryKey: ['fjall-runir'],
    queryFn: fetchFjallRunir,
  })

  const greinarQuery = useQuery({
    queryKey: ['fjall-greinar'],
    queryFn: fetchFjallGreinar,
  })

  const summaryQuery = useQuery({
    queryKey: ['audr', 'summary', month, year],
    queryFn: () => fetchAudrSummary(month, year),
    placeholderData: keepPreviousData,
  })

  const surtrQuery = useQuery({
    queryKey: ['audr', 'surtr', month, year, surtrPage, debouncedSearch, runFilter, sjodrFilter],
    queryFn: () =>
      fetchFjallSurtrPage({
        month,
        year,
        page: surtrPage,
        search: debouncedSearch || undefined,
        runId: runFilter !== 'all' ? runFilter : undefined,
        fundId: sjodrFilter !== 'all' ? sjodrFilter : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const sjodrQuery = useQuery({
    queryKey: ['fjall-sjodr'],
    queryFn: fetchFjallSjodr,
  })

  const idunnQuery = useQuery({
    queryKey: ['audr', 'idunn', idunnActiveFilter],
    queryFn: () =>
      fetchFjallIdunnFiltered({
        active: idunnActiveFilter !== 'all' ? idunnActiveFilter : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const skattIdunnQuery = useQuery({
    queryKey: ['audr', 'idunn-for-skatt'],
    queryFn: () => fetchFjallIdunnFiltered({ active: 'true' }),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setSurtrPage(1)
  }, [month, year, debouncedSearch, runFilter, sjodrFilter])

  const runir = useMemo(
    () => (runirQuery.data ?? []).map(toRunView).sort((a, b) => a.name.localeCompare(b.name)),
    [runirQuery.data],
  )
  const greinar = useMemo(
    () =>
      (greinarQuery.data ?? [])
        .map(toGreinView)
        .filter((grein) => isGreinVisibleOnPage(grein, 'audr'))
        .sort((a, b) => a.name.localeCompare(b.name)),
    [greinarQuery.data],
  )
  const audrRunir = useMemo(
    () =>
      runir.map((m) => ({
        id: m.id,
        name: m.name,
        color: m.color,
        icon: m.icon ?? null,
      })),
    [runir],
  )

  const summary = summaryQuery.data?.summary
  const skattUtilization = summaryQuery.data?.skattUtilization ?? []
  const surtrItems = surtrQuery.data?.surtr ?? []
  const surtrTotal = surtrQuery.data?.total ?? 0
  const surtrPageSize = surtrQuery.data?.pageSize ?? 20
  const idunnItems = useMemo(
    () =>
      [...(idunnQuery.data ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
      ),
    [idunnQuery.data],
  )
  const skattIdunn = skattIdunnQuery.data ?? []

  const skattByRunId = useMemo(
    () => new Map(skattUtilization.map((c) => [c.runId, c])),
    [skattUtilization],
  )

  const targetRunIds = useMemo(
    () => new Set(skattUtilization.map((c) => c.runId)),
    [skattUtilization],
  )

  const upcomingRenewals = useMemo(
    () =>
      idunnItems
        .filter((s) => s.active)
        .filter((s) => {
          const days = daysUntilRenewal(s.nextRenewal, s.billingCycle)
          return days >= 0 && days <= 7
        }).length,
    [idunnItems],
  )

  const skattUtilizationPct = useMemo(
    () => totalEffectiveSkattUtilization(skattUtilization, skattIdunn),
    [skattUtilization, skattIdunn],
  )

  const monthName = monthYearLabel(month, year)

  const prevMonth = () => {
    const prev = shiftMonth(month, year, -1)
    setMonth(prev.month)
    setYear(prev.year)
  }
  const nextMonth = () => {
    const next = shiftMonth(month, year, 1)
    setMonth(next.month)
    setYear(next.year)
  }

  const clearSelection = useCallback(() => setSelection(null), [])
  const clearCatalog = useCallback(() => setCatalog(null), [])
  const clearLaufarManage = useCallback(() => setLaufarManage(null), [])
  const clearSjodrManage = useCallback(() => setSjodrManage(null), [])

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    clearSelection()
    clearCatalog()
    clearLaufarManage()
    clearSjodrManage()
  }, [
    inspectorPinned,
    clearSelection,
    clearCatalog,
    clearLaufarManage,
    clearSjodrManage,
  ])

  const audrRootPath = useMemo(
    () => resolveAudrRunRootPath(runir),
    [runir],
  )

  const openCatalog = useCallback(() => {
    setSelection(null)
    setLaufarManage(null)
    setSjodrManage(null)
    setCatalog({
      tab: 'runir',
      selectedId: null,
      runPath: audrRootPath,
      runParent: null,
    })
  }, [audrRootPath])

  const openLaufarManage = useCallback(() => {
    setSelection(null)
    setCatalog(null)
    setSjodrManage(null)
    setLaufarManage({ selectedId: null })
  }, [])

  const openSjodrManage = useCallback(() => {
    setSelection(null)
    setCatalog(null)
    setLaufarManage(null)
    setSjodrManage({ selectedId: null })
  }, [])

  const selectEntity = useCallback((next: AudrSelection) => {
    setCatalog(null)
    setLaufarManage(null)
    setSjodrManage(null)
    setSelection(next)
  }, [])

  const inspectorOpen =
    inspectorPinned ||
    selection != null ||
    catalog != null ||
    laufarManage != null ||
    sjodrManage != null
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  const selectedSurtr =
    selection?.kind === 'surtr' ? surtrItems.find((b) => b.id === selection.id) : undefined
  const selectedIdunn =
    selection?.kind === 'idunn'
      ? idunnItems.find((s) => s.id === selection.id)
      : undefined
  const selectedSkatt =
    selection?.kind === 'skatt'
      ? skattUtilization.find((c) => c.id === selection.id)
      : selection?.kind === 'skatt-run'
        ? skattByRunId.get(selection.runId)
        : undefined

  const selectedSkattRunId = selectedSkatt?.runId ?? null

  const skattSurtrQuery = useQuery({
    queryKey: ['audr', 'surtr', month, year, 'skatt-inspector', selectedSkattRunId],
    queryFn: () =>
      fetchFjallSurtrPage({
        month,
        year,
        page: 1,
        runId: selectedSkattRunId!,
      }),
    enabled: Boolean(selectedSkattRunId),
    placeholderData: keepPreviousData,
  })

  const skattRunSurtr = useMemo(
    () =>
      [...(skattSurtrQuery.data?.surtr ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [skattSurtrQuery.data?.surtr],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'Escape' &&
        !inspectorPinned &&
        (selection || catalog || laufarManage || sjodrManage)
      ) {
        dismissInspector()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, selection, catalog, laufarManage, sjodrManage, dismissInspector])

  const isLoading =
    runirQuery.isLoading ||
    summaryQuery.isLoading ||
    surtrQuery.isLoading ||
    idunnQuery.isLoading

  if (isLoading && !summaryQuery.data) {
    return <AudrPageSkeleton />
  }

  const selectedSurtrId = selection?.kind === 'surtr' ? selection.id : null
  const selectedIdunnId = selection?.kind === 'idunn' ? selection.id : null

  return (
    <StudioLayout
      railLabel={terms.idunn}
      contextBar={
        <AudrContextBar
          monthName={monthName}
          summary={summary}
          upcomingRenewals={upcomingRenewals}
          skattUtilizationPct={skattUtilizationPct}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
          onAddSurtr={() => selectEntity({ kind: 'new-surtr' })}
          onAddIdunn={() => selectEntity({ kind: 'new-idunn' })}
          onAddSkatt={() => selectEntity({ kind: 'new-skatt' })}
          onManageSjodr={() => {
            setSelection(null)
            setCatalog(null)
            setLaufarManage(null)
            setSjodrManage({ selectedId: 'new' })
          }}
          onManageLaufar={() => {
            setSelection(null)
            setCatalog(null)
            setSjodrManage(null)
            setLaufarManage({ selectedId: 'new' })
          }}
        />
      }
      rail={
        idunnQuery.isFetching && idunnItems.length === 0 ? (
          <RailCatalogSkeleton rows={7} titleWidth="w-16" />
        ) : (
          <AudrIdunnRail
            idunnItems={idunnItems}
            funds={sjodrQuery.data ?? []}
            runir={audrRunir}
            selectedId={selectedIdunnId}
            activeFilter={idunnActiveFilter}
            onActiveFilterChange={setIdunnActiveFilter}
            filtersActive={idunnFiltersActive}
            onClearFilters={() => setIdunnActiveFilter('true')}
            onSelect={(id) => selectEntity({ kind: 'idunn', id })}
            onAdd={() => selectEntity({ kind: 'new-idunn' })}
            onOpenCatalog={openCatalog}
            onRefresh={refresh}
          />
        )
      }
      canvas={
        <div className="flex h-full min-h-0 flex-col">
          <AudrSurtrCanvas
            month={month}
            year={year}
            monthName={monthName}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            search={search}
            onSearchChange={setSearch}
            runFilter={runFilter}
            onRunFilterChange={setRunFilter}
            sjodrFilter={sjodrFilter}
            onSjodrFilterChange={setSjodrFilter}
            groupBy={groupBy}
            onGroupByChange={(value) => {
              setGroupBy(value)
              saveAudrCanvasGroupBy(value)
            }}
            runir={audrRunir}
            funds={sjodrQuery.data ?? []}
            filtersActive={surtrFiltersActive}
            onClearFilters={() => {
              setSearch('')
              setRunFilter('all')
              setSjodrFilter('all')
            }}
            onBringSkatt={() => selectEntity({ kind: 'skatt-carry' })}
            onManageLaufar={openLaufarManage}
            onManageSjodr={openSjodrManage}
            surtrItems={surtrItems}
            skattUtilization={skattUtilization}
            idunnItems={skattIdunn}
            surtrLoading={surtrQuery.isFetching}
            selectedSurtrId={selectedSurtrId}
            onSelectSurtr={(id) => selectEntity({ kind: 'surtr', id })}
            selectedIdunnId={selectedIdunnId}
            onSelectIdunn={(id) => selectEntity({ kind: 'idunn', id })}
            onSelectSkatt={(id) => selectEntity({ kind: 'skatt', id })}
            onSelectSkattRun={(runId) =>
              selectEntity(
                skattByRunId.has(runId)
                  ? { kind: 'skatt', id: skattByRunId.get(runId)!.id }
                  : { kind: 'skatt-run', runId },
              )
            }
            onAddSurtr={(runId) => selectEntity({ kind: 'new-surtr', runId })}
            surtrPage={surtrPage}
            surtrTotal={surtrTotal}
            surtrPageSize={surtrPageSize}
            onSurtrPageChange={setSurtrPage}
            surtrPageLoading={surtrQuery.isFetching}
          />
        </div>
      }
      inspectorState={inspectorState}
      inspectorHint={
        catalog
          ? terms.runir
          : laufarManage
            ? `Audr ${terms.laufar}`
            : sjodrManage
              ? terms.sjodr
              : `Select ${terms.surtr.toLowerCase()}, ${terms.idunn.toLowerCase()}, or ${terms.skatt.toLowerCase()} to inspect`
      }
      onDismissInspector={dismissInspector}
      inspector={
        catalog ? (
          <FjallCatalogInspector
            activeTab={catalog.tab}
            onTabChange={(tab) =>
              setCatalog({
                tab,
                selectedId: null,
                runPath: audrRootPath,
                runParent: null,
              })
            }
            greinar={greinar}
            runir={runir}
            selectedId={catalog.selectedId}
            runPath={catalog.runPath}
            runParent={catalog.runParent}
            onSelectId={(id) => setCatalog((current) => (current ? { ...current, selectedId: id } : current))}
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
            lockedTab="runir"
            rootRunPath={audrRootPath}
          />
        ) : laufarManage ? (
          <AudrLaufarInspector
            greinar={greinar}
            runir={runir}
            rootRunName={audrRootPath[0] ?? terms.audrGroup}
            selectedId={laufarManage.selectedId}
            onSelectId={(id) =>
              setLaufarManage((current) => (current ? { ...current, selectedId: id } : current))
            }
          />
        ) : sjodrManage ? (
          <AudrSjodrInspector
            month={month}
            year={year}
            skattUtilization={skattUtilization}
            idunnItems={skattIdunn}
            selectedId={sjodrManage.selectedId}
            onSelectId={(id) =>
              setSjodrManage((current) => (current ? { ...current, selectedId: id } : current))
            }
          />
        ) : selection ? (
          <AudrInspector
            selection={selection}
            runir={audrRunir}
            month={month}
            year={year}
            surtr={selectedSurtr}
            idunn={selectedIdunn}
            skatt={selectedSkatt}
            skattIdunn={skattIdunn}
            skattRunSurtr={skattRunSurtr}
            targetRunIds={targetRunIds}
            onSaved={() => {
              refresh()
              clearSelection()
            }}
            onDeleted={() => {
              refresh()
              clearSelection()
            }}
            onCancel={clearSelection}
          />
        ) : null
      }
    />
  )
}

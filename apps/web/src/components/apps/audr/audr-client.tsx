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
  fetchFjallBurnPage,
  fetchFjallRunir,
  fetchProvisionsSummary,
  fetchFjallSjodr,
  fetchFjallSupplylinesFiltered,
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
      railLabel={terms.subscriptions}
      contextBar={
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
          <div className="h-5 w-24 animate-pulse rounded bg-muted" />
          <div className="mt-2 h-3 w-48 animate-pulse rounded bg-muted" />
        </div>
      }
      rail={<RailCatalogSkeleton rows={7} titleWidth="w-16" />}
      canvas={<TableSkeleton rows={10} columns={4} />}
      inspectorState="hint"
      inspectorHint={`Select ${terms.expenses.toLowerCase()}, ${terms.subscriptions.toLowerCase()}, or ${terms.budgets.toLowerCase()} to inspect`}
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
  const [burnPage, setBurnPage] = useState(1)

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
    queryFn: () => fetchProvisionsSummary(month, year),
    placeholderData: keepPreviousData,
  })

  const burnQuery = useQuery({
    queryKey: ['audr', 'burn', month, year, burnPage, debouncedSearch, runFilter, sjodrFilter],
    queryFn: () =>
      fetchFjallBurnPage({
        month,
        year,
        page: burnPage,
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

  const supplylinesQuery = useQuery({
    queryKey: ['audr', 'supplylines', idunnActiveFilter],
    queryFn: () =>
      fetchFjallSupplylinesFiltered({
        active: idunnActiveFilter !== 'all' ? idunnActiveFilter : undefined,
      }),
    placeholderData: keepPreviousData,
  })

  const skattSupplylinesQuery = useQuery({
    queryKey: ['audr', 'supplylines-skatt'],
    queryFn: () => fetchFjallSupplylinesFiltered({ active: 'true' }),
    placeholderData: keepPreviousData,
  })

  useEffect(() => {
    setBurnPage(1)
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
  const cacheUtilization = summaryQuery.data?.cacheUtilization ?? []
  const burnItems = burnQuery.data?.burn ?? []
  const burnTotal = burnQuery.data?.total ?? 0
  const burnPageSize = burnQuery.data?.pageSize ?? 20
  const supplylines = useMemo(
    () =>
      [...(supplylinesQuery.data ?? [])].sort((left, right) =>
        left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }),
      ),
    [supplylinesQuery.data],
  )
  const skattSupplylines = skattSupplylinesQuery.data ?? []

  const cacheByRunId = useMemo(
    () => new Map(cacheUtilization.map((c) => [c.runId, c])),
    [cacheUtilization],
  )

  const targetRunIds = useMemo(
    () => new Set(cacheUtilization.map((c) => c.runId)),
    [cacheUtilization],
  )

  const upcomingRenewals = useMemo(
    () =>
      supplylines
        .filter((s) => s.active)
        .filter((s) => {
          const days = daysUntilRenewal(s.nextRenewal, s.billingCycle)
          return days >= 0 && days <= 7
        }).length,
    [supplylines],
  )

  const skattUtilizationPct = useMemo(
    () => totalEffectiveSkattUtilization(cacheUtilization, skattSupplylines),
    [cacheUtilization, skattSupplylines],
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

  const provisionsRootPath = useMemo(
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
      runPath: provisionsRootPath,
      runParent: null,
    })
  }, [provisionsRootPath])

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

  const selectedBurn =
    selection?.kind === 'burn' ? burnItems.find((b) => b.id === selection.id) : undefined
  const selectedSupplyline =
    selection?.kind === 'supplyline'
      ? supplylines.find((s) => s.id === selection.id)
      : undefined
  const selectedCache =
    selection?.kind === 'cache'
      ? cacheUtilization.find((c) => c.id === selection.id)
      : selection?.kind === 'cache-run'
        ? cacheByRunId.get(selection.runId)
        : undefined

  const selectedSkattRunId = selectedCache?.runId ?? null

  const skattBurnsQuery = useQuery({
    queryKey: ['audr', 'burn', month, year, 'skatt-inspector', selectedSkattRunId],
    queryFn: () =>
      fetchFjallBurnPage({
        month,
        year,
        page: 1,
        runId: selectedSkattRunId!,
      }),
    enabled: Boolean(selectedSkattRunId),
    placeholderData: keepPreviousData,
  })

  const skattRunBurns = useMemo(
    () =>
      [...(skattBurnsQuery.data?.burn ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [skattBurnsQuery.data?.burn],
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
    burnQuery.isLoading ||
    supplylinesQuery.isLoading

  if (isLoading && !summaryQuery.data) {
    return <AudrPageSkeleton />
  }

  const selectedBurnId = selection?.kind === 'burn' ? selection.id : null
  const selectedSupplylineId = selection?.kind === 'supplyline' ? selection.id : null

  return (
    <StudioLayout
      railLabel={terms.subscriptions}
      contextBar={
        <AudrContextBar
          monthName={monthName}
          summary={summary}
          upcomingRenewals={upcomingRenewals}
          skattUtilizationPct={skattUtilizationPct}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
          onAddBurn={() => selectEntity({ kind: 'new-burn' })}
          onAddSupplyline={() => selectEntity({ kind: 'new-supplyline' })}
          onAddCache={() => selectEntity({ kind: 'new-cache' })}
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
        supplylinesQuery.isFetching && supplylines.length === 0 ? (
          <RailCatalogSkeleton rows={7} titleWidth="w-16" />
        ) : (
          <AudrIdunnRail
            supplylines={supplylines}
            funds={sjodrQuery.data ?? []}
            runir={audrRunir}
            selectedId={selectedSupplylineId}
            activeFilter={idunnActiveFilter}
            onActiveFilterChange={setIdunnActiveFilter}
            filtersActive={idunnFiltersActive}
            onClearFilters={() => setIdunnActiveFilter('true')}
            onSelect={(id) => selectEntity({ kind: 'supplyline', id })}
            onAdd={() => selectEntity({ kind: 'new-supplyline' })}
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
            burns={burnItems}
            cacheUtilization={cacheUtilization}
            supplylines={skattSupplylines}
            burnsLoading={burnQuery.isFetching}
            selectedBurnId={selectedBurnId}
            onSelectBurn={(id) => selectEntity({ kind: 'burn', id })}
            selectedSupplylineId={selectedSupplylineId}
            onSelectSupplyline={(id) => selectEntity({ kind: 'supplyline', id })}
            onSelectCache={(id) => selectEntity({ kind: 'cache', id })}
            onSelectCacheRun={(runId) =>
              selectEntity(
                cacheByRunId.has(runId)
                  ? { kind: 'cache', id: cacheByRunId.get(runId)!.id }
                  : { kind: 'cache-run', runId },
              )
            }
            onAddBurn={(runId) => selectEntity({ kind: 'new-burn', runId })}
            burnPage={burnPage}
            burnTotal={burnTotal}
            burnPageSize={burnPageSize}
            onBurnPageChange={setBurnPage}
            burnPageLoading={burnQuery.isFetching}
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
              : `Select ${terms.expenses.toLowerCase()}, ${terms.subscriptions.toLowerCase()}, or ${terms.budgets.toLowerCase()} to inspect`
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
                runPath: provisionsRootPath,
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
            rootRunPath={provisionsRootPath}
          />
        ) : laufarManage ? (
          <AudrLaufarInspector
            greinar={greinar}
            runir={runir}
            rootRunName={provisionsRootPath[0] ?? terms.provisionsGroup}
            selectedId={laufarManage.selectedId}
            onSelectId={(id) =>
              setLaufarManage((current) => (current ? { ...current, selectedId: id } : current))
            }
          />
        ) : sjodrManage ? (
          <AudrSjodrInspector
            month={month}
            year={year}
            cacheUtilization={cacheUtilization}
            supplylines={skattSupplylines}
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
            burn={selectedBurn}
            supplyline={selectedSupplyline}
            cache={selectedCache}
            skattSupplylines={skattSupplylines}
            skattRunBurns={skattRunBurns}
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

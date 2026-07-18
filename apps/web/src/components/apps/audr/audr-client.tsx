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
  fetchFjallMarkers,
  fetchProvisionsSummary,
  fetchFjallSjodr,
  fetchFjallSupplylinesFiltered,
  fetchFjallTrails,
} from '@/lib/data-api'
import { daysUntilRenewal } from '@/lib/idunn-renewal'
import { toMarkerView, toTrailView } from '@/lib/data-format'
import {
  monthYearLabel,
  shiftMonth,
  type AudrCanvasGroupBy,
} from '@/lib/audr-format'
import { resolveAudrMarkerRootPath } from '@/lib/audr-marker-root'
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
  markerPath: string[]
  markerParent: string | null
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
  const [markerFilter, setMarkerFilter] = useState('all')
  const [sjodrFilter, setSjodrFilter] = useState('all')
  const [groupBy, setGroupBy] = useState<AudrCanvasGroupBy>(() => loadAudrCanvasGroupBy())
  const [idunnActiveFilter, setIdunnActiveFilter] = useState('true')
  const debouncedSearch = useDebounce(search, 300)
  const surtrFiltersActive =
    search !== '' || markerFilter !== 'all' || sjodrFilter !== 'all'
  const idunnFiltersActive = idunnActiveFilter !== 'true'

  const [selection, setSelection] = useState<AudrSelection | null>(null)
  const [catalog, setCatalog] = useState<CatalogState | null>(null)
  const [laufarManage, setLaufarManage] = useState<PanelManageState | null>(null)
  const [sjodrManage, setSjodrManage] = useState<PanelManageState | null>(null)
  const [burnPage, setBurnPage] = useState(1)

  const markersQuery = useQuery({
    queryKey: ['fjall-markers'],
    queryFn: fetchFjallMarkers,
  })

  const trailsQuery = useQuery({
    queryKey: ['fjall-trails'],
    queryFn: fetchFjallTrails,
  })

  const summaryQuery = useQuery({
    queryKey: ['audr', 'summary', month, year],
    queryFn: () => fetchProvisionsSummary(month, year),
    placeholderData: keepPreviousData,
  })

  const burnQuery = useQuery({
    queryKey: ['audr', 'burn', month, year, burnPage, debouncedSearch, markerFilter, sjodrFilter],
    queryFn: () =>
      fetchFjallBurnPage({
        month,
        year,
        page: burnPage,
        search: debouncedSearch || undefined,
        markerId: markerFilter !== 'all' ? markerFilter : undefined,
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
  }, [month, year, debouncedSearch, markerFilter, sjodrFilter])

  const markers = useMemo(
    () => (markersQuery.data ?? []).map(toMarkerView).sort((a, b) => a.name.localeCompare(b.name)),
    [markersQuery.data],
  )
  const trails = useMemo(
    () => (trailsQuery.data ?? []).map(toTrailView).sort((a, b) => a.name.localeCompare(b.name)),
    [trailsQuery.data],
  )
  const audrMarkers = useMemo(
    () =>
      markers.map((m) => ({
        id: m.id,
        name: m.name,
        color: m.color,
        icon: m.icon ?? null,
      })),
    [markers],
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

  const cacheByMarkerId = useMemo(
    () => new Map(cacheUtilization.map((c) => [c.markerId, c])),
    [cacheUtilization],
  )

  const targetMarkerIds = useMemo(
    () => new Set(cacheUtilization.map((c) => c.markerId)),
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
  const provisionsRootPath = useMemo(
    () => resolveAudrMarkerRootPath(markers),
    [markers],
  )

  const openCatalog = useCallback(() => {
    setSelection(null)
    setLaufarManage(null)
    setSjodrManage(null)
    setCatalog({
      tab: 'runir',
      selectedId: null,
      markerPath: provisionsRootPath,
      markerParent: null,
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
      : selection?.kind === 'cache-marker'
        ? cacheByMarkerId.get(selection.markerId)
        : undefined

  const selectedSkattMarkerId = selectedCache?.markerId ?? null

  const skattBurnsQuery = useQuery({
    queryKey: ['audr', 'burn', month, year, 'skatt-inspector', selectedSkattMarkerId],
    queryFn: () =>
      fetchFjallBurnPage({
        month,
        year,
        page: 1,
        markerId: selectedSkattMarkerId!,
      }),
    enabled: Boolean(selectedSkattMarkerId),
    placeholderData: keepPreviousData,
  })

  const skattMarkerBurns = useMemo(
    () =>
      [...(skattBurnsQuery.data?.burn ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
    [skattBurnsQuery.data?.burn],
  )

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (
        inspectorPinned ||
        (selection == null && catalog == null && laufarManage == null && sjodrManage == null)
      ) {
        return
      }
      const target = event.target as HTMLElement
      // Toolbar / form controls sit on the canvas; ignore them so inspector
      // switches (Laufar ↔ Sjodr) are not cleared by pointerdown before click.
      if (
        target.closest(
          'a, button, input, select, textarea, label, [data-inspectable], [data-studio-portal], [role="listbox"], [role="option"]',
        )
      ) {
        return
      }
      clearSelection()
      clearCatalog()
      clearLaufarManage()
      clearSjodrManage()
    },
    [
      inspectorPinned,
      selection,
      catalog,
      laufarManage,
      sjodrManage,
      clearSelection,
      clearCatalog,
      clearLaufarManage,
      clearSjodrManage,
    ],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (
        event.key === 'Escape' &&
        !inspectorPinned &&
        (selection || catalog || laufarManage || sjodrManage)
      ) {
        clearSelection()
        clearCatalog()
        clearLaufarManage()
        clearSjodrManage()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [
    inspectorPinned,
    selection,
    catalog,
    laufarManage,
    sjodrManage,
    clearSelection,
    clearCatalog,
    clearLaufarManage,
    clearSjodrManage,
  ])

  const isLoading =
    markersQuery.isLoading ||
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
            markers={audrMarkers}
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
        <div className="flex h-full min-h-0 flex-col" onPointerDown={handleCanvasPointerDown}>
          <AudrSurtrCanvas
            month={month}
            year={year}
            monthName={monthName}
            onPrevMonth={prevMonth}
            onNextMonth={nextMonth}
            search={search}
            onSearchChange={setSearch}
            markerFilter={markerFilter}
            onMarkerFilterChange={setMarkerFilter}
            sjodrFilter={sjodrFilter}
            onSjodrFilterChange={setSjodrFilter}
            groupBy={groupBy}
            onGroupByChange={(value) => {
              setGroupBy(value)
              saveAudrCanvasGroupBy(value)
            }}
            markers={audrMarkers}
            funds={sjodrQuery.data ?? []}
            filtersActive={surtrFiltersActive}
            onClearFilters={() => {
              setSearch('')
              setMarkerFilter('all')
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
            onSelectCacheMarker={(markerId) =>
              selectEntity(
                cacheByMarkerId.has(markerId)
                  ? { kind: 'cache', id: cacheByMarkerId.get(markerId)!.id }
                  : { kind: 'cache-marker', markerId },
              )
            }
            onAddBurn={(markerId) => selectEntity({ kind: 'new-burn', markerId })}
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
      inspector={
        catalog ? (
          <FjallCatalogInspector
            activeTab={catalog.tab}
            onTabChange={(tab) =>
              setCatalog({
                tab,
                selectedId: null,
                markerPath: provisionsRootPath,
                markerParent: null,
              })
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
            lockedTab="runir"
            rootMarkerPath={provisionsRootPath}
          />
        ) : laufarManage ? (
          <AudrLaufarInspector
            trails={trails}
            markers={markers}
            rootMarkerName={provisionsRootPath[0] ?? terms.provisionsGroup}
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
            markers={audrMarkers}
            month={month}
            year={year}
            burn={selectedBurn}
            supplyline={selectedSupplyline}
            cache={selectedCache}
            skattSupplylines={skattSupplylines}
            skattMarkerBurns={skattMarkerBurns}
            targetMarkerIds={targetMarkerIds}
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

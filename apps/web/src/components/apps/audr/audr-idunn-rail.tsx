import { ExternalLink, Plus, Repeat } from 'lucide-react'
import { Badge } from '@/components/core/ui/badge'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { MarkerBadge } from '@/components/apps/marker-badge'
import { liveMarkersById, toDisplayMarker } from '@/lib/embedded-markers'
import { toggleFjallSupplylineActive } from '@/lib/data-api'
import { daysUntilRenewal, getEffectiveNextRenewal } from '@/lib/idunn-renewal'
import { audrFmt } from '@/lib/audr-format'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { FjallSjodrView, FjallSupplyline } from '@/lib/data-types'
import { resolveSjodrColor } from '@/lib/sjodr-color'
import type { AudrMarker } from './audr-types'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

export function AudrIdunnRail({
  supplylines,
  funds,
  markers = [],
  selectedId,
  activeFilter,
  onActiveFilterChange,
  filtersActive,
  onClearFilters,
  onSelect,
  onAdd,
  onOpenCatalog,
  onRefresh,
}: {
  supplylines: FjallSupplyline[]
  funds: FjallSjodrView[]
  markers?: AudrMarker[]
  selectedId: string | null
  activeFilter: string
  onActiveFilterChange: (value: string) => void
  filtersActive: boolean
  onClearFilters: () => void
  onSelect: (id: string) => void
  onAdd: () => void
  onOpenCatalog: () => void
  onRefresh: () => void
}) {
  const terms = useTerms()
  const fundById = new Map(funds.map((fund) => [fund.id, fund]))
  const liveById = liveMarkersById(markers)
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={Repeat}>{terms.subscriptions}</StudioRailTitle>
        <div className="flex items-center gap-1">
          <ToolbarTooltip label={terms.runir}>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              onClick={onOpenCatalog}
              aria-label={terms.runir}
            >
              <ASGARD_ENTITY_ICONS.runir className="h-3.5 w-3.5" aria-hidden />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label={`Add ${terms.subscriptionSingular}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onAdd}
              aria-label={`Add ${terms.subscriptionSingular}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
      </div>

      <div className="shrink-0 border-b border-border px-3 py-2">
        <div className="flex items-center gap-2">
          <Select
            className="min-w-0 flex-1"
            value={activeFilter}
            onChange={onActiveFilterChange}
            options={[
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
              { value: 'all', label: 'All status' },
            ]}
          />
          {filtersActive ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-8 shrink-0 px-2 text-xs"
              onClick={onClearFilters}
            >
              Reset
            </Button>
          ) : null}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {supplylines.length === 0 ? (
          <p className="px-1 py-4 text-xs text-muted-foreground">
            No {terms.subscriptions.toLowerCase()} match this filter.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {supplylines.map((supplyline) => (
              <li key={supplyline.id}>
                <AudrIdunnRailCard
                  supplyline={supplyline}
                  liveById={liveById}
                  fundColor={
                    supplyline.fundId
                      ? resolveSjodrColor(
                          supplyline.fundId,
                          fundById.get(supplyline.fundId)?.color,
                        )
                      : null
                  }
                  fundName={
                    supplyline.fundId
                      ? (fundById.get(supplyline.fundId)?.name ?? undefined)
                      : undefined
                  }
                  selected={selectedId === supplyline.id}
                  onSelect={() => onSelect(supplyline.id)}
                  onToggleActive={onRefresh}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

function AudrIdunnRailCard({
  supplyline,
  liveById,
  fundColor,
  fundName,
  selected,
  onSelect,
  onToggleActive,
}: {
  supplyline: FjallSupplyline
  liveById: ReturnType<typeof liveMarkersById>
  fundColor?: string | null
  fundName?: string
  selected: boolean
  onSelect: () => void
  onToggleActive: () => void
}) {
  const effectiveRenewal = getEffectiveNextRenewal(supplyline.nextRenewal, supplyline.billingCycle)
  const daysUntil = daysUntilRenewal(supplyline.nextRenewal, supplyline.billingCycle)
  const renewingSoon = daysUntil <= 7 && supplyline.active

  const href = supplyline.url?.trim()
    ? supplyline.url.includes('://')
      ? supplyline.url
      : `https://${supplyline.url}`
    : null

  return (
    <div
      data-inspectable
      className={cn(
        'relative flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
        selected ? 'border-primary/40 bg-primary/10' : 'border-border hover:border-primary/50',
        !supplyline.active && 'opacity-50',
      )}
    >
      <Switch
        checked={supplyline.active}
        onCheckedChange={async (checked) => {
          await toggleFjallSupplylineActive(supplyline.id, checked)
          onToggleActive()
        }}
        className="mt-0.5 shrink-0 scale-75"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className={cn('flex items-center gap-1.5', href && 'pr-6')}>
          <span className="truncate text-sm font-medium text-foreground">{supplyline.name}</span>
          {fundColor ? (
            <span
              className="inline-block h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: fundColor }}
              title={fundName}
              aria-label={fundName}
            />
          ) : null}
          {renewingSoon ? (
            <Badge className="border-amber-500/30 bg-amber-500/10 px-1 py-0 text-[10px] text-amber-700 dark:text-amber-400">
              {daysUntil}d
            </Badge>
          ) : null}
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-1">
          {supplyline.markers.map((entry, i) => {
            const marker = toDisplayMarker(entry, liveById)
            if (!marker) return null
            return <MarkerBadge key={marker.id ?? i} marker={marker} />
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-muted-foreground">
          <span>
            {effectiveRenewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {audrFmt(supplyline.amount)}
            <span className="font-normal text-muted-foreground">
              {' '}
              / {CYCLE_LABELS[supplyline.billingCycle] ?? supplyline.billingCycle}
            </span>
          </span>
        </div>
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${supplyline.name} link`}
          title="Open link"
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          onClick={(e) => e.stopPropagation()}
        >
          <ExternalLink className="h-3.5 w-3.5" aria-hidden />
        </a>
      ) : null}
    </div>
  )
}

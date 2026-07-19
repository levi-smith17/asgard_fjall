import { ExternalLink, Plus, Repeat } from 'lucide-react'
import { Badge } from '@/components/core/ui/badge'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { RunBadge } from '@/components/apps/run-badge'
import { liveRunirById, toDisplayRun } from '@/lib/embedded-runir'
import { toggleFjallIdunnActive } from '@/lib/data-api'
import { daysUntilRenewal, getEffectiveNextRenewal } from '@/lib/idunn-renewal'
import { audrFmt } from '@/lib/audr-format'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { FjallSjodrView, FjallIdunn } from '@/lib/data-types'
import { resolveSjodrColor } from '@/lib/sjodr-color'
import type { AudrRun } from './audr-types'

const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Wk',
  BIWEEKLY: 'Bi-wk',
  MONTHLY: 'Mo',
  QUARTERLY: 'Qtr',
  ANNUALLY: 'Yr',
}

export function AudrIdunnRail({
  idunnItems,
  funds,
  runir = [],
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
  idunnItems: FjallIdunn[]
  funds: FjallSjodrView[]
  runir?: AudrRun[]
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
  const liveById = liveRunirById(runir)
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={Repeat}>{terms.idunn}</StudioRailTitle>
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
          <ToolbarTooltip label={`Add ${terms.idunnSingular}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onAdd}
              aria-label={`Add ${terms.idunnSingular}`}
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
        {idunnItems.length === 0 ? (
          <p className="px-1 py-4 text-xs text-muted-foreground">
            No {terms.idunn.toLowerCase()} match this filter.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {idunnItems.map((idunn) => (
              <li key={idunn.id}>
                <AudrIdunnRailCard
                  idunn={idunn}
                  liveById={liveById}
                  fundColor={
                    idunn.fundId
                      ? resolveSjodrColor(
                          idunn.fundId,
                          fundById.get(idunn.fundId)?.color,
                        )
                      : null
                  }
                  fundName={
                    idunn.fundId
                      ? (fundById.get(idunn.fundId)?.name ?? undefined)
                      : undefined
                  }
                  selected={selectedId === idunn.id}
                  onSelect={() => onSelect(idunn.id)}
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
  idunn,
  liveById,
  fundColor,
  fundName,
  selected,
  onSelect,
  onToggleActive,
}: {
  idunn: FjallIdunn
  liveById: ReturnType<typeof liveRunirById>
  fundColor?: string | null
  fundName?: string
  selected: boolean
  onSelect: () => void
  onToggleActive: () => void
}) {
  const effectiveRenewal = getEffectiveNextRenewal(idunn.nextRenewal, idunn.billingCycle)
  const daysUntil = daysUntilRenewal(idunn.nextRenewal, idunn.billingCycle)
  const renewingSoon = daysUntil <= 7 && idunn.active

  const href = idunn.url?.trim()
    ? idunn.url.includes('://')
      ? idunn.url
      : `https://${idunn.url}`
    : null

  return (
    <div
      data-inspectable
      className={cn(
        'relative flex w-full items-start gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
        selected ? 'border-primary/40 bg-primary/10' : 'border-border hover:border-primary/50',
        !idunn.active && 'opacity-50',
      )}
    >
      <Switch
        checked={idunn.active}
        onCheckedChange={async (checked) => {
          await toggleFjallIdunnActive(idunn.id, checked)
          onToggleActive()
        }}
        className="mt-0.5 shrink-0 scale-75"
        onClick={(e) => e.stopPropagation()}
      />
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <div className={cn('flex items-center gap-1.5', href && 'pr-6')}>
          <span className="truncate text-sm font-medium text-foreground">{idunn.name}</span>
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
          {(idunn.runir ?? []).map((entry, i) => {
            const run = toDisplayRun(entry, liveById)
            if (!run) return null
            return <RunBadge key={run.id ?? i} run={run} />
          })}
        </div>
        <div className="mt-1.5 flex items-center justify-between gap-2 text-muted-foreground">
          <span>
            {effectiveRenewal.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
          <span className="font-medium tabular-nums text-foreground">
            {audrFmt(idunn.amount)}
            <span className="font-normal text-muted-foreground">
              {' '}
              / {CYCLE_LABELS[idunn.billingCycle] ?? idunn.billingCycle}
            </span>
          </span>
        </div>
      </button>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${idunn.name} link`}
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

import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import {
  ContextBarSplitAddButton,
  type ContextBarSplitAddItem,
} from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { useTerms } from '@/hooks/use-terminology'
import { audrFmt } from '@/lib/audr-format'
import { cn } from '@/lib/utils'

export function AudrContextBar({
  monthName,
  summary,
  upcomingRenewals,
  skattUtilizationPct,
  inspectorPinned,
  onInspectorPinnedChange,
  onAddBurn,
  onAddSupplyline,
  onAddCache,
  onManageSjodr,
  onManageLaufar,
}: {
  monthName: string
  summary?: {
    monthlySupplylineCost: number
    totalBurn: number
    totalMonthSpend: number
    activeSupplylines: number
  }
  upcomingRenewals: number
  skattUtilizationPct: number | null
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onAddBurn: () => void
  onAddSupplyline: () => void
  onAddCache: () => void
  onManageSjodr: () => void
  onManageLaufar: () => void
}) {
  const terms = useTerms()

  const splitItems = (
    [
      {
        id: 'idunn',
        label: `Add ${terms.subscriptionSingular}`,
        icon: ASGARD_ENTITY_ICONS.idunn,
        onSelect: onAddSupplyline,
      },
      {
        id: 'laufar',
        label: `Add ${terms.laufarSingular}`,
        icon: ASGARD_ENTITY_ICONS.laufar,
        onSelect: onManageLaufar,
      },
      {
        id: 'sjodr',
        label: `Add ${terms.sjodrSingular}`,
        icon: ASGARD_ENTITY_ICONS.sjodr,
        onSelect: onManageSjodr,
      },
      {
        id: 'skatt',
        label: `Add ${terms.budgetSingular}`,
        icon: ASGARD_ENTITY_ICONS.skatt,
        onSelect: onAddCache,
      },
    ] satisfies ContextBarSplitAddItem[]
  ).sort((left, right) =>
    left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
  )

  return (
    <StudioContextBar
      aria-label="Audr context"
      title={terms.provisions}
      subtitle={`${monthName} · ${terms.expenses}, ${terms.subscriptions}, & ${terms.budgets}`}
      metadata={
        summary ? (
          <div className="hidden min-w-0 flex-wrap items-center gap-1.5 md:flex">
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              {audrFmt(summary.totalBurn)} {terms.expenses.toLowerCase()}
            </span>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {audrFmt(summary.monthlySupplylineCost)} {terms.subscriptions.toLowerCase()}
            </span>
            {skattUtilizationPct != null ? (
              <span
                className={cn(
                  'shrink-0 rounded-full px-2 py-0.5 text-xs',
                  skattUtilizationPct >= 100
                    ? 'bg-destructive/15 text-destructive'
                    : skattUtilizationPct >= 80
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400'
                      : 'bg-muted text-muted-foreground',
                )}
              >
                {Math.round(skattUtilizationPct)}% {terms.budgets.toLowerCase()}
              </span>
            ) : null}
            {upcomingRenewals > 0 ? (
              <span className="shrink-0 rounded-full bg-amber-500/15 px-2 py-0.5 text-xs text-amber-700 dark:text-amber-400">
                {upcomingRenewals} renewal{upcomingRenewals === 1 ? '' : 's'}
              </span>
            ) : null}
          </div>
        ) : null
      }
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync
            pinned={inspectorPinned}
            onPinnedChange={onInspectorPinnedChange}
          />
          <ContextBarSplitAddButton
            label={`Add ${terms.expenseSingular}`}
            onClick={onAddBurn}
            menuLabel="More Audr create options"
            items={splitItems}
          />
        </>
      }
    />
  )
}

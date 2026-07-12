import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarAddButton } from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
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
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label="Audr context"
      title={terms.provisions}
      subtitle={`${monthName} · ${terms.expenses}, ${terms.subscriptions}, & ${terms.budgets}`}
      metadata={
        summary ? (
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
              {audrFmt(summary.totalBurn)} {terms.expenses.toLowerCase()}
            </span>
            <span className="hidden shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground sm:inline">
              {audrFmt(summary.monthlySupplylineCost)} {terms.subscriptions.toLowerCase()}
            </span>
            {skattUtilizationPct != null ? (
              <span
                className={cn(
                  'hidden shrink-0 rounded-full px-2 py-0.5 text-xs md:inline',
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
          <ContextBarAddButton
            label={`Add ${terms.expenseSingular}`}
            onClick={onAddBurn}
          />
        </>
      }
    />
  )
}

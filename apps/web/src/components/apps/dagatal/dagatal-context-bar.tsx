import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function DagatalContextBar({
  eventCount,
  eventsLoading,
  eventsError,
  inspectorPinned,
  onInspectorPinnedChange,
}: {
  eventCount?: number
  eventsLoading?: boolean
  eventsError?: string | null
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label="Dagatal context"
      title={terms.calendar}
      subtitle="Calendar & events"
      metadata={
        eventsError ? (
          <span className="shrink-0 rounded-full bg-destructive/15 px-2 py-0.5 text-xs text-destructive">
            Events unavailable
          </span>
        ) : eventsLoading ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            Loading events…
          </span>
        ) : eventCount != null ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs',
              eventCount > 0 ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
            )}
          >
            {eventCount} event{eventCount === 1 ? '' : 's'}
          </span>
        ) : null
      }
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync
            pinned={inspectorPinned}
            onPinnedChange={onInspectorPinnedChange}
          />
        </>
      }
    />
  )
}

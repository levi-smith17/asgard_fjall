import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function SendibodContextBar({
  messageCount,
  unreadCount,
  inspectorPinned,
  onInspectorPinnedChange,
}: {
  messageCount?: number
  unreadCount?: number
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label="Sendibod header"
      title={terms.messages}
      subtitle="Contact-form messages"
      metadata={
        messageCount != null ? (
          <span
            className={cn(
              'shrink-0 rounded-full px-2 py-0.5 text-xs',
              (unreadCount ?? 0) > 0
                ? 'bg-primary/15 text-primary'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {(unreadCount ?? 0) > 0
              ? `${unreadCount} unread`
              : `${messageCount} message${messageCount === 1 ? '' : 's'}`}
          </span>
        ) : null
      }
      actions={
        <ContextBarPinAndSync
          pinned={inspectorPinned}
          onPinnedChange={onInspectorPinnedChange}
        />
      }
    />
  )
}

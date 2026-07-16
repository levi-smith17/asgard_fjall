import { Settings } from 'lucide-react'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function SendibodContextBar({
  messageCount,
  unreadCount,
  inspectorPinned,
  onInspectorPinnedChange,
  onOpenSettings,
}: {
  messageCount?: number
  unreadCount?: number
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onOpenSettings: () => void
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
        <>
          <GlobalSearchTrigger />
          <ToolbarTooltip label="Message settings">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label="Message settings"
            >
              <Settings className="h-4 w-4" aria-hidden />
            </button>
          </ToolbarTooltip>
          <ContextBarPinAndSync
            pinned={inspectorPinned}
            onPinnedChange={onInspectorPinnedChange}
          />
        </>
      }
    />
  )
}

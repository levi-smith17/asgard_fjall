import { Pin, PinOff } from 'lucide-react'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

export function ContextBarInspectorPin({
  pinned,
  onPinnedChange,
}: {
  pinned: boolean
  onPinnedChange: (pinned: boolean) => void
}) {
  return (
    <ToolbarTooltip
      label={
        pinned
          ? 'Unpin inspector — panel closes when nothing is selected'
          : 'Pin inspector — stay in editing mode while you work'
      }
    >
      <button
        type="button"
        onClick={() => onPinnedChange(!pinned)}
        className={cn(
          'rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground',
          pinned && 'bg-primary/15 text-primary',
        )}
        aria-pressed={pinned}
        aria-label={pinned ? 'Unpin inspector' : 'Pin inspector'}
      >
        {pinned ? <PinOff className="h-4 w-4" /> : <Pin className="h-4 w-4" />}
      </button>
    </ToolbarTooltip>
  )
}

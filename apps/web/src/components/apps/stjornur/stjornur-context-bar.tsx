import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarAddButton } from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'

export function StjornurContextBar({
  outpostCount,
  inspectorPinned,
  onInspectorPinnedChange,
  onAddOutpost,
  addOutpostDisabled,
}: {
  outpostCount?: number
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onAddOutpost: () => void
  addOutpostDisabled?: boolean
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label="Stjornur header"
      title={terms.stjornur}
      subtitle="Outpost networks and resource planning"
      metadata={
        outpostCount != null ? (
          <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {outpostCount} outpost{outpostCount === 1 ? '' : 's'}
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
          <span className={addOutpostDisabled ? 'pointer-events-none opacity-40' : undefined}>
            <ContextBarAddButton label="Add Outpost" onClick={onAddOutpost} />
          </span>
        </>
      }
    />
  )
}

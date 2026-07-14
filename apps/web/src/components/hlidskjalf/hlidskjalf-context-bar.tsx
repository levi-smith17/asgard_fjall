import { ContextBarAddButton } from '@/components/core/ui/context-bar-add-button'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerminology } from '@/hooks/use-terminology'
import { termsFor } from '@/lib/terminology'

export function HlidskjalfContextBar({
  inspectorPinned,
  onInspectorPinnedChange,
  onAddLauf,
}: {
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onAddLauf: () => void
}) {
  const { terms, style } = useTerminology()
  const subtitle = style === 'STANDARD' ? undefined : termsFor('STANDARD').dashboard

  return (
    <StudioContextBar
      aria-label={`${terms.dashboard} context`}
      title={terms.dashboard}
      subtitle={subtitle}
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync pinned={inspectorPinned} onPinnedChange={onInspectorPinnedChange} />
          <ContextBarAddButton
            label={`Add ${terms.laufarSingular}`}
            shortLabel={`Add ${terms.laufarSingular}`}
            onClick={onAddLauf}
          />
        </>
      }
    />
  )
}

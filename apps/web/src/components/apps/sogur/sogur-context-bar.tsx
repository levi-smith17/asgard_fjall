import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarAddButton } from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'

export function SogurContextBar({
  sagaCount,
  onNewSaga,
  inspectorPinned,
  onInspectorPinnedChange,
  showInspectorPin,
}: {
  sagaCount?: number
  onNewSaga: () => void
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  showInspectorPin?: boolean
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label={`${terms.notes} context`}
      title={terms.notes}
      subtitle={`${terms.notesSingular} pages and journal entries`}
      metadata={
        sagaCount != null ? (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
            {sagaCount} {sagaCount === 1 ? terms.notesSingular.toLowerCase() : terms.notes.toLowerCase()}
          </span>
        ) : null
      }
      actions={
        <>
          <GlobalSearchTrigger />
          {showInspectorPin ? (
            <ContextBarPinAndSync
              pinned={inspectorPinned}
              onPinnedChange={onInspectorPinnedChange}
            />
          ) : null}
          <ContextBarAddButton
            label={`Add ${terms.notesSingular}`}
            shortLabel={`Add ${terms.notesSingular}`}
            onClick={onNewSaga}
          />
        </>
      }
    />
  )
}

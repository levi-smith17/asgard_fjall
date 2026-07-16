import { ContextBarSplitAddButton } from '@/components/core/ui/context-bar-add-button'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'

export function HlidskjalfContextBar({
  inspectorPinned,
  onInspectorPinnedChange,
  onAddLauf,
  onAddGreinar,
  onAddRunir,
}: {
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onAddLauf: () => void
  onAddGreinar: () => void
  onAddRunir: () => void
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label={`${terms.dashboard} context`}
      title={terms.dashboard}
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync pinned={inspectorPinned} onPinnedChange={onInspectorPinnedChange} />
          <ContextBarSplitAddButton
            label={`Add ${terms.laufarSingular}`}
            shortLabel={`Add ${terms.laufarSingular}`}
            onClick={onAddLauf}
            menuLabel="More create options"
            items={[
              {
                id: 'greinar',
                label: `Add ${terms.greinSingular}`,
                icon: ASGARD_ENTITY_ICONS.greinar,
                onSelect: onAddGreinar,
              },
              {
                id: 'runir',
                label: `Add ${terms.runSingular}`,
                icon: ASGARD_ENTITY_ICONS.runir,
                onSelect: onAddRunir,
              },
            ].sort((left, right) =>
              left.label.localeCompare(right.label, undefined, { sensitivity: 'base' }),
            )}
          />
        </>
      }
    />
  )
}

import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarAddButton } from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerms } from '@/hooks/use-terminology'

export function NidjatalContextBar({
  personCount,
  inspectorPinned,
  onInspectorPinnedChange,
  onAddPerson,
}: {
  personCount: number
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  onAddPerson: () => void
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label={`${terms.nidjatal} header`}
      title={terms.nidjatal}
      subtitle={`${personCount} ${personCount === 1 ? terms.nidjatalPerson : terms.nidjatalPersonPlural}`.toLowerCase()}
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync pinned={inspectorPinned} onPinnedChange={onInspectorPinnedChange} />
          <ContextBarAddButton label={`Add ${terms.nidjatalPerson}`} onClick={onAddPerson} />
        </>
      }
    />
  )
}

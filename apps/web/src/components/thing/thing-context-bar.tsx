import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { useTerminology } from '@/hooks/use-terminology'
import { termsFor } from '@/lib/terminology'

export function ThingContextBar() {
  const { terms, style } = useTerminology()
  const subtitle = style === 'STANDARD' ? undefined : termsFor('STANDARD').settings

  return (
    <StudioContextBar
      aria-label={`${terms.settings} context`}
      title={terms.settings}
      subtitle={subtitle}
      actions={<GlobalSearchTrigger />}
    />
  )
}

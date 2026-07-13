import { useState } from 'react'
import { ContextBarSearch } from '@/components/core/layout/context-bar-search'
import { StudioDataToolbar } from '@/components/core/layout/studio-data-toolbar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import { RefreshCw } from 'lucide-react'

export function SendibodFilterBar({
  search,
  onSearchChange,
  onRefresh,
  isRefreshing,
}: {
  search: string
  onSearchChange: (value: string) => void
  onRefresh: () => void
  isRefreshing?: boolean
}) {
  const terms = useTerms()
  const [searchExpanded, setSearchExpanded] = useState(() => search.trim().length > 0)

  return (
    <StudioDataToolbar
      trailing={
        <>
          <ContextBarSearch
            expanded={searchExpanded}
            onExpandedChange={setSearchExpanded}
            query={search}
            onQueryChange={onSearchChange}
            placeholder={`Filter ${terms.messages.toLowerCase()}…`}
            tooltipLabel={`Filter ${terms.messages}`}
            triggerIcon="filter"
            active={search.trim().length > 0}
          />
          <ToolbarTooltip label={`Refresh ${terms.messages}`}>
            <button
              type="button"
              onClick={onRefresh}
              className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Refresh ${terms.messages}`}
            >
              <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
            </button>
          </ToolbarTooltip>
        </>
      }
    />
  )
}

import { useState } from 'react'
import { Boxes, Globe } from 'lucide-react'
import { ContextBarSearch } from '@/components/core/layout/context-bar-search'
import { StudioDataToolbar } from '@/components/core/layout/studio-data-toolbar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

const iconButtonClass =
  'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground'

export function StarfieldControlBar({
  search,
  onSearchChange,
  onManageResources,
  onManageSystems,
  resourcesActive,
  systemsActive,
}: {
  search: string
  onSearchChange: (value: string) => void
  onManageResources: () => void
  onManageSystems: () => void
  resourcesActive?: boolean
  systemsActive?: boolean
}) {
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
            placeholder="Filter outposts…"
            tooltipLabel="Filter starfield"
            triggerIcon="filter"
            active={search.trim().length > 0}
          />
          <ToolbarTooltip label="Resources">
            <button
              type="button"
              onClick={onManageResources}
              className={cn(iconButtonClass, resourcesActive && 'bg-primary/15 text-primary')}
              aria-label="Resources"
              aria-pressed={resourcesActive}
            >
              <Boxes className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label="Systems">
            <button
              type="button"
              onClick={onManageSystems}
              className={cn(iconButtonClass, systemsActive && 'bg-primary/15 text-primary')}
              aria-label="Systems"
              aria-pressed={systemsActive}
            >
              <Globe className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        </>
      }
    />
  )
}

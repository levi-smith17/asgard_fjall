import { Valknut } from '@/components/core/icons/valknut'
import { StudioDataToolbar } from '@/components/core/layout/studio-data-toolbar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

export function CairnToolbar({ description, onRefresh, isRefreshing, leading }: { description: string; onRefresh: () => void; isRefreshing: boolean; leading?: React.ReactNode }) {
  return (
    <StudioDataToolbar
      description={description}
      leading={leading}
      trailing={
        <ToolbarTooltip label="Refresh from Cairn">
          <button type="button" className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground" onClick={onRefresh} aria-label="Refresh from Cairn">
            <Valknut className={cn('h-4 w-4', isRefreshing && 'animate-spin')} aria-hidden />
          </button>
        </ToolbarTooltip>
      }
    />
  )
}

export function CairnSplitCanvas({ showDetail, list, detail }: { showDetail: boolean; list: React.ReactNode; detail?: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className={cn('flex min-h-0 flex-1 flex-col border-r border-border', showDetail && 'hidden md:flex')}>{list}</div>
      {showDetail && detail ? <div className="flex min-h-0 flex-1 flex-col overflow-hidden">{detail}</div> : null}
    </div>
  )
}

export function CairnPanelHeader({ title, actions }: { title: string; actions?: React.ReactNode }) {
  return (
    <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 border-b border-border px-3">
      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{title}</span>
      {actions}
    </div>
  )
}

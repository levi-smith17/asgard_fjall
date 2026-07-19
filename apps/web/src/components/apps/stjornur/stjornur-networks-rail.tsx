import { Network, Plus, Settings } from 'lucide-react'
import type { StjornurNetwork } from '@/lib/stjornur-types'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'

function extractNetworkId(sk: string): string {
  return sk.replace(/^SF#NETWORK#/, '')
}

export function StjornurNetworksRail({
  networks,
  selectedId,
  onSelect,
  onInspect,
  onNew,
}: {
  networks: StjornurNetwork[]
  selectedId: string | null
  onSelect: (id: string) => void
  onInspect: (id: string) => void
  onNew: () => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={Network}>Networks</StudioRailTitle>
        <ToolbarTooltip label="Add network">
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onNew}
            aria-label="Add network"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {networks.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            No networks yet. Add one to get started.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {networks.map((network) => {
              const id = extractNetworkId(network.sk)
              const selected = id === selectedId
              return (
                <li key={id}>
                  <div
                    className={cn(
                      'group flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
                      selected
                        ? 'border-primary/40 bg-primary/10'
                        : 'border-border hover:border-primary/50',
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => onSelect(id)}
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                    >
                      <span className="shrink-0 rounded bg-muted px-1 py-0.5 font-mono text-[9px] text-muted-foreground">
                        {network.abbreviation}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium text-foreground">
                        {network.name}
                      </span>
                    </button>
                    <ToolbarTooltip label="Edit network">
                      <button
                        type="button"
                        onClick={() => onInspect(id)}
                        className="shrink-0 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label="Edit network"
                      >
                        <Settings className="h-3.5 w-3.5" />
                      </button>
                    </ToolbarTooltip>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

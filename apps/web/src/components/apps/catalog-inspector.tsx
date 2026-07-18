import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import type { FjallRunView, FjallGreinView } from '@/lib/data-types'
import { RunirBrowser, type RunParentContext } from '@/components/apps/runir-browser'
import { RunInspector } from '@/components/apps/run-inspector'
import { GreinInspector } from '@/components/apps/grein-inspector'
import { Button } from '@/components/core/ui/button'
import { ContextTabButton } from '@/components/core/ui/context-tab'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createFjallRun,
  createFjallGrein,
  deleteFjallRun,
  deleteFjallGrein,
  updateFjallRun,
  updateFjallGrein,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { cn } from '@/lib/utils'

export type FjallCatalogTab = 'greinar' | 'runir'

function CatalogTabBar({
  active,
  onChange,
}: {
  active: FjallCatalogTab
  onChange: (tab: FjallCatalogTab) => void
}) {
  const terms = useTerms()
  const GreinarIcon = ASGARD_ENTITY_ICONS.greinar
  const RunirIcon = ASGARD_ENTITY_ICONS.runir
  return (
    <nav className="flex h-14 shrink-0 border-b border-border" aria-label="Fjall catalog">
      <ContextTabButton
        active={active === 'greinar'}
        onClick={() => onChange('greinar')}
        className="flex-1 justify-center gap-1.5 text-xs"
      >
        <GreinarIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {terms.greinar}
      </ContextTabButton>
      <ContextTabButton
        active={active === 'runir'}
        onClick={() => onChange('runir')}
        className="flex-1 justify-center gap-1.5 text-xs"
      >
        <RunirIcon className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {terms.runir}
      </ContextTabButton>
    </nav>
  )
}

function GreinarList({
  greinar,
  selectedId,
  onSelect,
  onNew,
}: {
  greinar: FjallGreinView[]
  selectedId: string | null
  onSelect: (id: string) => void
  onNew: () => void
}) {
  const terms = useTerms()
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">{greinar.length} total</span>
        <ToolbarTooltip label={`New ${terms.greinSingular.toLowerCase()}`}>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7"
            onClick={onNew}
            aria-label={`New ${terms.greinSingular.toLowerCase()}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {greinar.length === 0 ? (
          <p className="px-3 py-4 text-xs text-muted-foreground">No greinar yet.</p>
        ) : (
          <ul>
            {greinar.map((grein) => (
              <li key={grein.id}>
                <button
                  type="button"
                  onClick={() => onSelect(grein.id)}
                  className={cn(
                    'flex w-full px-3 py-2 text-left text-sm transition-colors hover:bg-muted-hover',
                    selectedId === grein.id && 'bg-primary/10 text-primary',
                  )}
                >
                  <span className="truncate font-medium">{grein.name}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

export function FjallCatalogInspector({
  activeTab,
  onTabChange,
  greinar,
  runir,
  selectedId,
  runPath,
  runParent,
  onSelectId,
  onRunPathChange,
  onRunParentChange,
  onClearSelection,
  lockedTab,
  rootRunPath = [],
}: {
  activeTab: FjallCatalogTab
  onTabChange: (tab: FjallCatalogTab) => void
  greinar: FjallGreinView[]
  runir: FjallRunView[]
  selectedId: string | null
  runPath: string[]
  runParent: string | null
  onSelectId: (id: string | null) => void
  onRunPathChange: (path: string[]) => void
  onRunParentChange: (parent: string | null) => void
  onClearSelection: () => void
  /** When set, hide the tab bar and keep the inspector on this tab. */
  lockedTab?: FjallCatalogTab
  /** When set, Runir browsing cannot navigate above this path. */
  rootRunPath?: string[]
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [runFilter, setRunFilter] = useState('')
  const effectiveTab = lockedTab ?? activeTab

  const sortedGreinar = useMemo(
    () => [...greinar].sort((a, b) => a.name.localeCompare(b.name)),
    [greinar],
  )

  const selectedGrein =
    effectiveTab === 'greinar' && selectedId && selectedId !== 'new'
      ? (greinar.find((grein) => grein.id === selectedId) ?? null)
      : null
  const isNewGrein = effectiveTab === 'greinar' && selectedId === 'new'

  const selectedRun =
    effectiveTab === 'runir' && selectedId && selectedId !== 'new'
      ? (runir.find((run) => run.id === selectedId) ?? null)
      : null
  const isNewRun = effectiveTab === 'runir' && selectedId === 'new'

  const invalidateFjall = () => {
    void queryClient.invalidateQueries({ queryKey: ['fjall-greinar'] })
    void queryClient.invalidateQueries({ queryKey: ['fjall-runir'] })
    void queryClient.invalidateQueries({ queryKey: ['fjall-laufar'] })
  }

  const saveGrein = useMutation({
    mutationFn: async (values: { name: string; hiddenPages: string[] }) => {
      if (isNewGrein) return createFjallGrein(values)
      return updateFjallGrein(selectedId!, values)
    },
    onSuccess: () => {
      toast.success(isNewGrein ? 'Grein created' : 'Grein saved')
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save grein'),
  })

  const deleteGrein = useMutation({
    mutationFn: () => deleteFjallGrein(selectedId!),
    onSuccess: () => {
      toast.success('Grein deleted')
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  const saveRun = useMutation({
    mutationFn: async (values: { name: string; color: string; icon: string | null }) => {
      if (isNewRun) return createFjallRun(values)
      return updateFjallRun(selectedId!, values)
    },
    onSuccess: () => {
      toast.success(isNewRun ? `${terms.runSingular} created` : `${terms.runSingular} saved`)
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save run'),
  })

  const deleteRun = useMutation({
    mutationFn: () => deleteFjallRun(selectedId!),
    onSuccess: () => {
      toast.success(`${terms.runSingular} deleted`)
      invalidateFjall()
      onClearSelection()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to delete'),
  })

  if (effectiveTab === 'greinar' && selectedId) {
    return (
      <GreinInspector
        grein={selectedGrein}
        isNew={isNewGrein}
        title={
          isNewGrein
            ? `New ${terms.greinSingular}`
            : `Edit ${terms.greinSingular}`
        }
        onBack={onClearSelection}
        onSave={async (values) => {
          await saveGrein.mutateAsync(values)
        }}
        onDelete={async () => {
          await deleteGrein.mutateAsync()
        }}
        isSaving={saveGrein.isPending}
      />
    )
  }

  if (effectiveTab === 'runir' && selectedId) {
    return (
      <RunInspector
        run={selectedRun}
        isNew={isNewRun}
        parentPrefix={runParent}
        title={isNewRun ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`}
        onBack={onClearSelection}
        onSave={async (values) => {
          await saveRun.mutateAsync(values)
        }}
        onDelete={async () => {
          await deleteRun.mutateAsync()
        }}
        isSaving={saveRun.isPending}
      />
    )
  }

  const runirCopy =
    rootRunPath.length > 0
      ? `Manage ${rootRunPath.join('/')} and its nested ${terms.runir.toLowerCase()}.`
      : `Tag ${terms.laufar.toLowerCase()} with hierarchical ${terms.runir.toLowerCase()}.`

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      {lockedTab ? (
        <InspectorChrome>
          <InspectorChromeTitle
            eyebrow="Inspector"
            title={
              effectiveTab === 'greinar'
                ? `Manage ${terms.greinar}`
                : `Manage ${terms.runir}`
            }
          />
        </InspectorChrome>
      ) : (
        <CatalogTabBar active={activeTab} onChange={onTabChange} />
      )}
      {lockedTab ? null : (
        <div className="border-b border-border px-4 py-3">
          <p className="text-sm font-semibold text-foreground">
            {effectiveTab === 'greinar'
              ? terms.greinar
              : rootRunPath.length > 0
                ? rootRunPath[rootRunPath.length - 1]
                : terms.runir}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {effectiveTab === 'greinar'
              ? `Organize ${terms.laufar.toLowerCase()} and ${terms.spjold.toLowerCase()} into named ${terms.greinar.toLowerCase()}.`
              : runirCopy}
          </p>
        </div>
      )}
      {effectiveTab === 'greinar' ? (
        <GreinarList
          greinar={sortedGreinar}
          selectedId={selectedId}
          onSelect={onSelectId}
          onNew={() => onSelectId('new')}
        />
      ) : (
        <RunirBrowser
          runir={runir}
          search={runFilter}
          onSearchChange={setRunFilter}
          groupPath={runPath}
          selectedId={selectedId}
          onSelect={(id) => onSelectId(id)}
          onNew={() => onSelectId('new')}
          onNewSubrun={(parent: RunParentContext) => {
            onRunParentChange(parent.name)
            onSelectId('new')
          }}
          onNavigateInto={(path) => {
            if (
              rootRunPath.length > 0 &&
              (path.length < rootRunPath.length ||
                !rootRunPath.every((segment, index) => path[index] === segment))
            ) {
              return
            }
            onRunPathChange(path)
            onSelectId(null)
          }}
          rootPath={rootRunPath}
        />
      )}
    </div>
  )
}

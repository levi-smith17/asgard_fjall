import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Plus, Settings } from 'lucide-react'
import { toast } from 'sonner'
import type { FjallRunView, FjallGreinView, FjallLaufView } from '@/lib/data-types'
import { LaufInspector, type LaufDraft } from '@/components/apps/lauf-inspector'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createFjallLauf,
  deleteFjallLauf,
  fetchFjallLaufar,
  updateFjallLauf,
} from '@/lib/data-api'
import { toLaufView } from '@/lib/data-format'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { liveRunirById, withLiveRun } from '@/lib/embedded-runir'
import { isAudrRootName, isUnderAudrRunRoot } from '@/lib/audr-run-root'
import { useTerms } from '@/hooks/use-terminology'
import { cn, includesFoldedSearch } from '@/lib/utils'

function normalizeHref(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) return ''
  return trimmed.includes('://') ? trimmed : `https://${trimmed}`
}

export function AudrLaufarInspector({
  greinar,
  runir,
  rootRunName,
  selectedId,
  onSelectId,
}: {
  greinar: FjallGreinView[]
  runir: FjallRunView[]
  rootRunName: string
  selectedId: string | null
  onSelectId: (id: string | null) => void
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const [search, setSearch] = useState('')
  const LaufarIcon = ASGARD_ENTITY_ICONS.laufar
  const liveById = useMemo(() => liveRunirById(runir), [runir])

  const laufarQuery = useQuery({
    queryKey: ['fjall-laufar'],
    queryFn: fetchFjallLaufar,
  })

  const greinarById = useMemo(() => new Map(greinar.map((grein) => [grein.id, grein])), [greinar])
  const audrGrein = useMemo(
    () =>
      greinar.find((grein) => grein.name === rootRunName) ??
      greinar.find((grein) => isAudrRootName(grein.name)) ??
      null,
    [greinar, rootRunName],
  )
  const audrRunIds = useMemo(() => {
    return new Set(
      runir
        .filter(
          (run) =>
            isUnderAudrRunRoot(run.name) ||
            run.name === rootRunName ||
            run.name.startsWith(`${rootRunName}/`),
        )
        .map((run) => run.id),
    )
  }, [runir, rootRunName])
  const rootRun = useMemo(
    () =>
      runir.find((run) => run.name === rootRunName) ??
      runir.find((run) => isAudrRootName(run.name)) ??
      null,
    [runir, rootRunName],
  )

  const laufar = useMemo(() => {
    const all = (laufarQuery.data ?? []).map((lauf) => toLaufView(lauf, greinarById))
    return all
      .filter((lauf) =>
        lauf.runir.some((run) => audrRunIds.has(run.id)),
      )
      .sort((left, right) =>
        left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }),
      )
  }, [laufarQuery.data, greinarById, audrRunIds])

  const filtered = useMemo(() => {
    if (!search.trim()) return laufar
    return laufar
      .filter((lauf) => {
        const haystack = [
          lauf.title,
          lauf.url,
          lauf.notes,
          ...lauf.runir.map((run) => run.name),
        ].join(' ')
        return includesFoldedSearch(haystack, search)
      })
      .sort((left, right) =>
        left.title.localeCompare(right.title, undefined, { sensitivity: 'base' }),
      )
  }, [laufar, search])

  const isNew = selectedId === 'new'
  const selectedLauf =
    selectedId && selectedId !== 'new'
      ? (laufar.find((lauf) => lauf.id === selectedId) ?? null)
      : null

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['fjall-laufar'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (draft: LaufDraft) => {
      if (!audrGrein) {
        throw new Error(`Create a "${rootRunName}" ${terms.greinSingular.toLowerCase()} first`)
      }
      const payload = {
        title: draft.title.trim() || draft.url.trim(),
        url: draft.url.trim(),
        notes: draft.notes.trim() || undefined,
        greinId: audrGrein.id,
        runIds: draft.runIds,
      }
      if (isNew) return createFjallLauf(payload)
      return updateFjallLauf(selectedId!, payload)
    },
    onSuccess: () => {
      toast.success(isNew ? `${terms.laufarSingular} created` : `${terms.laufarSingular} saved`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to save ${terms.laufarSingular}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteFjallLauf(selectedId!),
    onSuccess: () => {
      toast.success(`${terms.laufarSingular} deleted`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to delete ${terms.laufarSingular}`),
  })

  if (selectedId) {
    return (
      <LaufInspector
        lauf={selectedLauf}
        isNew={isNew}
        greinar={greinar}
        runir={runir.filter(
          (run) =>
            isUnderAudrRunRoot(run.name) ||
            run.name === rootRunName ||
            run.name.startsWith(`${rootRunName}/`),
        )}
        runPickerInitialPath={[rootRunName]}
        defaultRunIds={isNew && rootRun ? [rootRun.id] : undefined}
        lockedGreinId={audrGrein?.id}
        showBack
        onClose={() => onSelectId(null)}
        onSave={async (draft) => {
          await saveMutation.mutateAsync(draft)
        }}
        onDelete={async () => {
          await deleteMutation.mutateAsync()
        }}
        isSaving={saveMutation.isPending || deleteMutation.isPending}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Inspector" title={`Manage ${terms.laufar}`} />
      </InspectorChrome>
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <div className="border-b border-border px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Manage {terms.laufar.toLowerCase()} tagged with {rootRunName} or a nested{' '}
            {terms.runSingular.toLowerCase()}. Click a card to open the link.
          </p>
        </div>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <FilterInput
            value={search}
            onChange={setSearch}
            placeholder={`Filter ${terms.laufar.toLowerCase()}…`}
            className="min-w-0 flex-1"
          />
          <ToolbarTooltip label={`New ${terms.laufarSingular}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-8 w-8 shrink-0"
              onClick={() => onSelectId('new')}
              aria-label={`New ${terms.laufarSingular}`}
            >
              <Plus className="h-4 w-4" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
        <div className="space-y-2 p-3">
          {laufarQuery.isLoading ? (
            <p className="px-1 py-4 text-sm text-muted-foreground">Loading…</p>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
              <LaufarIcon className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
              <p className="text-sm text-muted-foreground">
                No {terms.laufar.toLowerCase()} tagged under {rootRunName}.
              </p>
              <button
                type="button"
                onClick={() => onSelectId('new')}
                className="mt-1 text-sm text-primary hover:underline"
              >
                Create one
              </button>
            </div>
          ) : (
            filtered.map((lauf) => (
              <LaufarCard
                key={lauf.id}
                lauf={lauf}
                liveById={liveById}
                onOpenLink={() => {
                  const href = normalizeHref(lauf.url)
                  if (href) window.open(href, '_blank', 'noopener,noreferrer')
                }}
                onEdit={() => onSelectId(lauf.id)}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}

function LaufarCard({
  lauf,
  liveById,
  onOpenLink,
  onEdit,
}: {
  lauf: FjallLaufView
  liveById: ReturnType<typeof liveRunirById>
  onOpenLink: () => void
  onEdit: () => void
}) {
  return (
    <div className="relative rounded-lg border border-border bg-card text-left transition-colors hover:border-primary/40">
      <button
        type="button"
        onClick={onOpenLink}
        className="flex w-full items-start gap-2.5 p-3 pr-10 text-left"
      >
        {lauf.favicon ? (
          <img src={lauf.favicon} alt="" className="mt-0.5 h-5 w-5 shrink-0 rounded-sm" />
        ) : (
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-sm bg-muted text-muted-foreground">
            <ExternalLink className="h-3 w-3" aria-hidden />
          </span>
        )}
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-foreground">
            {lauf.title || lauf.url}
          </span>
          <span className="mt-0.5 block truncate text-xs text-muted-foreground">{lauf.url}</span>
          {lauf.runir.length > 0 ? (
            <span className="mt-1.5 flex flex-wrap gap-1">
              {lauf.runir.slice(0, 3).map((run) => {
                const live = withLiveRun(run, liveById)
                return (
                  <span
                    key={live.id}
                    className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                  >
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: live.color }}
                      aria-hidden
                    />
                    {live.name.split('/').pop()}
                  </span>
                )
              })}
            </span>
          ) : null}
        </span>
      </button>
      <ToolbarTooltip label="Edit">
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation()
            onEdit()
          }}
          className={cn(
            'absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md',
            'text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
          )}
          aria-label={`Edit ${lauf.title || lauf.url}`}
        >
          <Settings className="h-3.5 w-3.5" aria-hidden />
        </button>
      </ToolbarTooltip>
    </div>
  )
}

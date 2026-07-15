import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet } from 'lucide-react'
import { toast } from 'sonner'
import type { CairnCacheUtilization, CairnSjodrView, CairnSupplyline } from '@/lib/cairn-types'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createCairnSjodr,
  deleteCairnSjodr,
  fetchCairnSjodr,
  updateCairnSjodr,
} from '@/lib/cairn-api'
import { audrFmt, skattUtilizationColor } from '@/lib/audr-format'
import { effectiveSkattSpent, effectiveSkattUtilization } from '@/lib/audr-skatt-idunn'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function AudrSjodrInspector({
  month,
  year,
  cacheUtilization,
  supplylines,
  selectedId,
  onSelectId,
}: {
  month: number
  year: number
  cacheUtilization: CairnCacheUtilization[]
  supplylines: CairnSupplyline[]
  selectedId: string | null
  onSelectId: (id: string | null) => void
}) {
  const terms = useTerms()
  const queryClient = useQueryClient()

  const sjodrQuery = useQuery({
    queryKey: ['cairn-sjodr'],
    queryFn: fetchCairnSjodr,
  })

  const funds = sjodrQuery.data ?? []
  const isNew = selectedId === 'new'
  const selected = !isNew && selectedId ? (funds.find((fund) => fund.id === selectedId) ?? null) : null

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['cairn-sjodr'] })
    void queryClient.invalidateQueries({ queryKey: ['audr'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (draft: { name: string; description: string }) => {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
      }
      if (isNew) return createCairnSjodr(payload)
      return updateCairnSjodr(selectedId!, payload)
    },
    onSuccess: () => {
      toast.success(isNew ? `${terms.sjodrSingular} created` : `${terms.sjodrSingular} saved`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to save ${terms.sjodrSingular}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCairnSjodr(selectedId!),
    onSuccess: () => {
      toast.success(`${terms.sjodrSingular} deleted`)
      invalidate()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to delete ${terms.sjodrSingular}`),
  })

  if (selectedId) {
    return (
      <SjodrForm
        fund={selected}
        isNew={isNew}
        isSaving={saveMutation.isPending || deleteMutation.isPending}
        onBack={() => onSelectId(null)}
        onSave={async (draft) => {
          await saveMutation.mutateAsync(draft)
        }}
        onDelete={async () => {
          await deleteMutation.mutateAsync()
        }}
      />
    )
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={terms.provisions} title={terms.sjodr} />
      </InspectorChrome>
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          Group {terms.budgets}, {terms.subscriptions}, and {terms.expenses} under named{' '}
          {terms.sjodr.toLowerCase()}.
        </p>
        <ToolbarTooltip label={`New ${terms.sjodrSingular}`}>
          <Button
            type="button"
            size="icon"
            variant="secondary"
            className="h-7 w-7 shrink-0"
            onClick={() => onSelectId('new')}
            aria-label={`New ${terms.sjodrSingular}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden />
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="min-h-0 min-w-0 flex-1 space-y-2 overflow-y-auto overflow-x-hidden p-3">
        {sjodrQuery.isLoading ? (
          <p className="px-1 py-4 text-sm text-muted-foreground">Loading…</p>
        ) : funds.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <Wallet className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
            <p className="text-sm text-muted-foreground">No {terms.sjodr.toLowerCase()} yet.</p>
            <button
              type="button"
              onClick={() => onSelectId('new')}
              className="mt-1 text-sm text-primary hover:underline"
            >
              Create one
            </button>
          </div>
        ) : (
          funds.map((fund) => (
            <SjodrCard
              key={fund.id}
              fund={fund}
              month={month}
              year={year}
              caches={cacheUtilization.filter((cache) => cache.fundId === fund.id)}
              supplylines={supplylines.filter((line) => line.fundId === fund.id)}
              onEdit={() => onSelectId(fund.id)}
            />
          ))
        )}
      </div>
    </div>
  )
}

function SjodrCard({
  fund,
  month,
  year,
  caches,
  supplylines,
  onEdit,
}: {
  fund: CairnSjodrView
  month: number
  year: number
  caches: CairnCacheUtilization[]
  supplylines: CairnSupplyline[]
  onEdit: () => void
}) {
  const terms = useTerms()
  const totals = useMemo(() => {
    const limit = caches.reduce((sum, cache) => sum + cache.limit, 0)
    const spent = caches.reduce(
      (sum, cache) => sum + effectiveSkattSpent(cache, supplylines),
      0,
    )
    const utilization =
      limit > 0
        ? (spent / limit) * 100
        : caches.length > 0
          ? caches.reduce((sum, cache) => sum + effectiveSkattUtilization(cache, supplylines), 0) /
            caches.length
          : 0
    return { limit, spent, utilization }
  }, [caches, supplylines])

  return (
    <button
      type="button"
      onClick={onEdit}
      className="w-full rounded-lg border border-border bg-card p-3 text-left transition-colors hover:border-primary/40"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">{fund.name}</p>
          {fund.description ? (
            <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{fund.description}</p>
          ) : null}
        </div>
        <span className="shrink-0 text-[10px] text-muted-foreground">
          {caches.length} {terms.budgets.toLowerCase()}
        </span>
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2 text-xs">
          <span className="text-muted-foreground">{terms.budgets}</span>
          <span className="tabular-nums text-foreground">
            {audrFmt(totals.spent)}
            <span className="text-muted-foreground"> / {audrFmt(totals.limit)}</span>
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div
            className={cn('h-full rounded-full transition-all', skattUtilizationColor(totals.utilization))}
            style={{ width: `${Math.min(100, Math.max(0, totals.utilization))}%` }}
          />
        </div>
        <p className="text-[10px] tabular-nums text-muted-foreground">
          {Math.round(totals.utilization)}% · {month}/{year}
        </p>
      </div>
    </button>
  )
}

function SjodrForm({
  fund,
  isNew,
  isSaving,
  onBack,
  onSave,
  onDelete,
}: {
  fund: CairnSjodrView | null
  isNew: boolean
  isSaving: boolean
  onBack: () => void
  onSave: (draft: { name: string; description: string }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const terms = useTerms()
  const [name, setName] = useState(fund?.name ?? '')
  const [description, setDescription] = useState(fund?.description ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorFormHeader
        title={isNew ? `New ${terms.sjodrSingular}` : `Edit ${terms.sjodrSingular}`}
        icon={Wallet}
        onBack={onBack}
        showBack
      />
      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Name" />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Description</span>
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            rows={4}
            placeholder="Optional description"
            className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </label>
      </div>
      <InspectorFormActions
        isNew={isNew}
        isSaving={isSaving}
        canSave={!!name.trim()}
        createLabel={`Create ${terms.sjodrSingular}`}
        saveLabel="Save"
        deleteLabel={`Delete ${terms.sjodrSingular.toLowerCase()}`}
        onSave={() => void onSave({ name, description })}
        showDelete={!isNew}
        onDelete={() => setDeleteOpen(true)}
        className="px-4"
      />
      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${terms.sjodrSingular}`}
        description={`Delete "${fund?.name}"? Associated ${terms.budgets.toLowerCase()}, ${terms.subscriptions.toLowerCase()}, and ${terms.expenses.toLowerCase()} will be unassigned.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => {
          void (async () => {
            await onDelete()
            setDeleteOpen(false)
          })()
        }}
        onCancel={() => setDeleteOpen(false)}
      />
    </div>
  )
}

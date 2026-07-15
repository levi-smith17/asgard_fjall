import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
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
import { SwitchField } from '@/components/core/ui/switch-field'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  createCairnSjodr,
  deleteCairnSjodr,
  fetchCairnSjodr,
  updateCairnSjodr,
} from '@/lib/cairn-api'
import {
  getDefaultSjodrId,
  isDefaultSjodrId,
  setDefaultSjodrId,
} from '@/lib/audr-default-sjodr'
import { audrFmt, skattUtilizationColor } from '@/lib/audr-format'
import { effectiveSkattSpent, effectiveSkattUtilization } from '@/lib/audr-skatt-idunn'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
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
  const SjodrIcon = ASGARD_ENTITY_ICONS.sjodr
  const [defaultFundId, setDefaultFundIdState] = useState(() => getDefaultSjodrId())

  const sjodrQuery = useQuery({
    queryKey: ['cairn-sjodr'],
    queryFn: fetchCairnSjodr,
  })

  const funds = sjodrQuery.data ?? []
  const isNew = selectedId === 'new'
  const selected = !isNew && selectedId ? (funds.find((fund) => fund.id === selectedId) ?? null) : null

  const writeFunds = (next: CairnSjodrView[]) => {
    queryClient.setQueryData<CairnSjodrView[]>(['cairn-sjodr'], next)
  }

  const invalidateAudr = () => {
    void queryClient.invalidateQueries({ queryKey: ['audr'] })
  }

  const saveMutation = useMutation({
    mutationFn: async (draft: { name: string; description: string; isDefault: boolean }) => {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim() || null,
      }
      const fund = isNew
        ? await createCairnSjodr(payload)
        : await updateCairnSjodr(selectedId!, payload)
      return { fund, isDefault: draft.isDefault }
    },
    onSuccess: ({ fund, isDefault }) => {
      const existing = queryClient.getQueryData<CairnSjodrView[]>(['cairn-sjodr']) ?? []
      const next = isNew
        ? [...existing, fund].sort((a, b) =>
            a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }),
          )
        : existing.map((row) => (row.id === fund.id ? fund : row))
      writeFunds(next)
      if (isDefault) {
        setDefaultSjodrId(fund.id)
        setDefaultFundIdState(fund.id)
      } else if (isDefaultSjodrId(fund.id)) {
        setDefaultSjodrId(null)
        setDefaultFundIdState(null)
      }
      toast.success(isNew ? `${terms.sjodrSingular} created` : `${terms.sjodrSingular} saved`)
      invalidateAudr()
      onSelectId(null)
    },
    onError: (error) =>
      toast.error(error instanceof Error ? error.message : `Failed to save ${terms.sjodrSingular}`),
  })

  const deleteMutation = useMutation({
    mutationFn: () => deleteCairnSjodr(selectedId!),
    onSuccess: () => {
      const existing = queryClient.getQueryData<CairnSjodrView[]>(['cairn-sjodr']) ?? []
      writeFunds(existing.filter((fund) => fund.id !== selectedId))
      if (selectedId && isDefaultSjodrId(selectedId)) {
        setDefaultSjodrId(null)
        setDefaultFundIdState(null)
      }
      toast.success(`${terms.sjodrSingular} deleted`)
      invalidateAudr()
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
        isDefault={isNew ? false : defaultFundId === selectedId}
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
        {sjodrQuery.isPending && !sjodrQuery.data ? (
          <SjodrListSkeleton />
        ) : funds.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
            <SjodrIcon className="mb-2 h-8 w-8 text-muted-foreground/40" aria-hidden />
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
              isDefault={defaultFundId === fund.id}
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

function SjodrListSkeleton() {
  return (
    <div className="space-y-2" aria-hidden>
      {Array.from({ length: 3 }).map((_, index) => (
        <div
          key={index}
          className="h-[104px] animate-pulse rounded-lg border border-border bg-muted/40"
        />
      ))}
    </div>
  )
}

function SjodrCard({
  fund,
  month,
  year,
  isDefault,
  caches,
  supplylines,
  onEdit,
}: {
  fund: CairnSjodrView
  month: number
  year: number
  isDefault: boolean
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
          <div className="flex min-w-0 items-center gap-1.5">
            <p className="truncate text-sm font-medium text-foreground">{fund.name}</p>
            {isDefault ? (
              <span className="shrink-0 rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
                Default
              </span>
            ) : null}
          </div>
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
  isDefault: initialDefault,
  isSaving,
  onBack,
  onSave,
  onDelete,
}: {
  fund: CairnSjodrView | null
  isNew: boolean
  isDefault: boolean
  isSaving: boolean
  onBack: () => void
  onSave: (draft: { name: string; description: string; isDefault: boolean }) => Promise<void>
  onDelete: () => Promise<void>
}) {
  const terms = useTerms()
  const [name, setName] = useState(fund?.name ?? '')
  const [description, setDescription] = useState(fund?.description ?? '')
  const [isDefault, setIsDefault] = useState(initialDefault)
  const [deleteOpen, setDeleteOpen] = useState(false)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorFormHeader
        title={isNew ? `New ${terms.sjodrSingular}` : `Edit ${terms.sjodrSingular}`}
        icon={ASGARD_ENTITY_ICONS.sjodr}
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
        <SwitchField
          checked={isDefault}
          onCheckedChange={setIsDefault}
          label={`Default ${terms.sjodrSingular.toLowerCase()}`}
          description={`Pre-select on new ${terms.expenses.toLowerCase()}, ${terms.subscriptions.toLowerCase()}, and ${terms.budgets.toLowerCase()}.`}
        />
      </div>
      <InspectorFormActions
        isNew={isNew}
        isSaving={isSaving}
        canSave={!!name.trim()}
        createLabel={`Create ${terms.sjodrSingular}`}
        saveLabel="Save"
        deleteLabel={`Delete ${terms.sjodrSingular.toLowerCase()}`}
        onSave={() => void onSave({ name, description, isDefault })}
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

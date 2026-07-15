import { useRef, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { InspectorFormActions } from '@/components/core/ui/inspector-form-actions'
import { deleteCairnBurn, deleteCairnCache, deleteCairnSupplyline } from '@/lib/cairn-api'
import { markerShortLabel } from '@/lib/audr-format'
import { useTerms } from '@/hooks/use-terminology'
import type { Terms } from '@/lib/terminology'
import type { CairnBurn, CairnCacheUtilization, CairnSupplyline } from '@asgard/types'
import type { AudrMarker, AudrSelection } from './audr-types'
import { InlineBurnForm, type AudrSaveActionRef } from './inline-burn-form'
import { InlineSupplylineForm } from './inline-supplyline-form'
import { InlineCacheForm } from './inline-cache-form'
import { AudrSkattCarryInspector } from './audr-skatt-carry-inspector'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { AudrSkattAllocationPanel } from './audr-skatt-allocation-panel'

const BURN_FORM_ID = 'audr-burn-form'
const SUPPLYLINE_FORM_ID = 'audr-supplyline-form'
const CACHE_FORM_ID = 'audr-cache-form'

export function AudrInspector({
  selection,
  markers,
  month,
  year,
  burn,
  supplyline,
  cache,
  skattSupplylines,
  skattMarkerBurns = [],
  targetMarkerIds,
  onSaved,
  onDeleted,
  onCancel,
}: {
  selection: AudrSelection
  markers: AudrMarker[]
  month: number
  year: number
  burn?: CairnBurn
  supplyline?: CairnSupplyline
  cache?: CairnCacheUtilization
  skattSupplylines: CairnSupplyline[]
  skattMarkerBurns?: CairnBurn[]
  targetMarkerIds: Set<string>
  onSaved: () => void
  onDeleted: () => void
  onCancel: () => void
}) {
  const terms = useTerms()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const saveActionRef = useRef<(() => Promise<void>) | null>(null) as AudrSaveActionRef

  if (selection.kind === 'skatt-carry') {
    return (
      <AudrSkattCarryInspector
        targetMonth={month}
        targetYear={year}
        targetMarkerIds={targetMarkerIds}
        markers={markers}
        onComplete={() => {
          onSaved()
          onCancel()
        }}
      />
    )
  }

  const title = inspectorTitle(selection, markers, terms, burn, supplyline, cache)
  const showBurnForm = selection.kind === 'new-burn' || selection.kind === 'burn'
  const showSupplylineForm = selection.kind === 'new-supplyline' || selection.kind === 'supplyline'
  const showCacheForm =
    selection.kind === 'new-cache' ||
    selection.kind === 'cache' ||
    selection.kind === 'cache-marker'

  const showSave = showBurnForm || showSupplylineForm || showCacheForm
  const isNew =
    selection.kind === 'new-burn' ||
    selection.kind === 'new-supplyline' ||
    selection.kind === 'new-cache' ||
    selection.kind === 'cache-marker'

  const saveLabel =
    selection.kind === 'burn'
      ? 'Save changes'
      : selection.kind === 'supplyline'
        ? 'Save changes'
        : selection.kind === 'cache'
          ? 'Save changes'
          : selection.kind === 'new-burn'
            ? `Add ${terms.expenseSingular}`
            : selection.kind === 'new-supplyline'
              ? `Add ${terms.subscriptionSingular}`
              : `Add ${terms.budgetSingular}`

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={audrInspectorKind(selection, terms)} title={title} />
      </InspectorChrome>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {showBurnForm ? (
          <InlineBurnForm
            key={
              selection.kind === 'burn'
                ? selection.id
                : `new-burn:${selection.kind === 'new-burn' ? (selection.markerId ?? '') : ''}`
            }
            burn={burn}
            defaultMarkerId={selection.kind === 'new-burn' ? selection.markerId : undefined}
            tags={markers}
            formId={BURN_FORM_ID}
            saveActionRef={saveActionRef}
            onSaved={onSaved}
          />
        ) : null}

        {showSupplylineForm ? (
          <InlineSupplylineForm
            key={
              selection.kind === 'supplyline'
                ? selection.id
                : 'new-supplyline'
            }
            supplyline={supplyline}
            tags={markers}
            formId={SUPPLYLINE_FORM_ID}
            saveActionRef={saveActionRef}
            onSaved={onSaved}
          />
        ) : null}

        {showCacheForm ? (
          <>
            <InlineCacheForm
              key={
                selection.kind === 'cache'
                  ? selection.id
                  : selection.kind === 'cache-marker'
                    ? `cache-marker:${selection.markerId}`
                    : `new-cache:${selection.kind === 'new-cache' ? (selection.markerId ?? '') : ''}`
              }
              cache={cache}
              defaultMarkerId={
                selection.kind === 'cache-marker'
                  ? selection.markerId
                  : selection.kind === 'new-cache'
                    ? selection.markerId
                    : undefined
              }
              markers={markers}
              month={month}
              year={year}
              formId={CACHE_FORM_ID}
              saveActionRef={saveActionRef}
              onSaved={onSaved}
            />
            {selection.kind === 'cache' && cache ? (
              <>
                <div className="border-t border-border" />
                <AudrSkattAllocationPanel
                  cache={cache}
                  burns={skattMarkerBurns}
                  supplylines={skattSupplylines}
                />
              </>
            ) : null}
          </>
        ) : null}
      </div>

      {showSave ? (
        <InspectorFormActions
          isNew={isNew}
          createLabel={saveLabel}
          saveLabel={saveLabel}
          onSave={() => {
            void saveActionRef.current?.()
          }}
        />
      ) : null}

      {selection.kind === 'burn' && burn ? (
        <>
          <div className="shrink-0 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove {terms.expenseSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.expenseSingular.toLowerCase()}?`}
            description={<>This will permanently remove &ldquo;{burn.name}&rdquo; and any attached receipt.</>}
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteCairnBurn(burn.id)
                setConfirmDelete(false)
                onDeleted()
              } finally {
                setDeleting(false)
              }
            }}
          />
        </>
      ) : null}

      {selection.kind === 'supplyline' && supplyline ? (
        <>
          <div className="shrink-0 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove {terms.subscriptionSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.subscriptionSingular.toLowerCase()}?`}
            description={<>This will permanently remove &ldquo;{supplyline.name}&rdquo;.</>}
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteCairnSupplyline(supplyline.id)
                setConfirmDelete(false)
                onDeleted()
              } finally {
                setDeleting(false)
              }
            }}
          />
        </>
      ) : null}

      {selection.kind === 'cache' && cache ? (
        <>
          <div className="shrink-0 border-t border-border px-5 py-4">
            <Button
              type="button"
              variant="outline"
              className="w-full gap-2 border-destructive/40 text-destructive hover:border-destructive/60 hover:bg-destructive/10"
              disabled={deleting}
              onClick={() => setConfirmDelete(true)}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing…
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove {terms.budgetSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.budgetSingular.toLowerCase()}?`}
            description={
              <>
                Remove the {terms.budgetSingular.toLowerCase()} limit for{' '}
                {markerShortLabel(cache.markerId, markers, cache)} this month?
              </>
            }
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteCairnCache(cache.id)
                setConfirmDelete(false)
                onDeleted()
              } finally {
                setDeleting(false)
              }
            }}
          />
        </>
      ) : null}
    </div>
  )
}

function audrInspectorKind(selection: AudrSelection, terms: Terms): string {
  switch (selection.kind) {
    case 'new-burn':
    case 'burn':
      return terms.expenses
    case 'new-supplyline':
    case 'supplyline':
      return terms.subscriptions
    case 'new-cache':
    case 'cache':
    case 'cache-marker':
    case 'skatt-carry':
      return terms.budgets
    default:
      return terms.provisions
  }
}

function inspectorTitle(
  selection: AudrSelection,
  markers: AudrMarker[],
  terms: Terms,
  burn?: CairnBurn,
  supplyline?: CairnSupplyline,
  cache?: CairnCacheUtilization,
): string {
  switch (selection.kind) {
    case 'new-burn':
      return `Add ${terms.expenseSingular}`
    case 'burn':
      return burn?.name ?? terms.expenseSingular
    case 'new-supplyline':
      return `Add ${terms.subscriptionSingular}`
    case 'supplyline':
      return supplyline?.name ?? terms.subscriptionSingular
    case 'new-cache':
      return `Add ${terms.budgetSingular}`
    case 'cache-marker':
      return `Add ${terms.budgetSingular}`
    case 'cache':
      return markerShortLabel(cache?.markerId ?? '', markers, cache) || terms.budgets
    default:
      return terms.provisions
  }
}

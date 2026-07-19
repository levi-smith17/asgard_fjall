import { useRef, useState } from 'react'
import { Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { InspectorFormActions } from '@/components/core/ui/inspector-form-actions'
import { deleteFjallSurtr, deleteFjallSkatt, deleteFjallIdunn } from '@/lib/data-api'
import { runShortLabel } from '@/lib/audr-format'
import { useTerms } from '@/hooks/use-terminology'
import type { Terms } from '@/lib/terminology'
import type { FjallSurtr, FjallSkattUtilization, FjallIdunn } from '@/lib/data-types'
import type { AudrRun, AudrSelection } from './audr-types'
import { InlineSurtrForm, type AudrSaveActionRef } from './inline-surtr-form'
import { InlineIdunnForm } from './inline-idunn-form'
import { InlineSkattForm } from './inline-skatt-form'
import { AudrSkattCarryInspector } from './audr-skatt-carry-inspector'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { AudrSkattAllocationPanel } from './audr-skatt-allocation-panel'

const BURN_FORM_ID = 'audr-surtr-form'
const SUPPLYLINE_FORM_ID = 'audr-idunn-form'
const CACHE_FORM_ID = 'audr-skatt-form'

export function AudrInspector({
  selection,
  runir,
  month,
  year,
  surtr,
  idunn,
  skatt,
  skattIdunn,
  skattRunSurtr = [],
  targetRunIds,
  onSaved,
  onDeleted,
  onCancel,
}: {
  selection: AudrSelection
  runir: AudrRun[]
  month: number
  year: number
  surtr?: FjallSurtr
  idunn?: FjallIdunn
  skatt?: FjallSkattUtilization
  skattIdunn: FjallIdunn[]
  skattRunSurtr?: FjallSurtr[]
  targetRunIds: Set<string>
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
        targetRunIds={targetRunIds}
        runir={runir}
        onComplete={() => {
          onSaved()
          onCancel()
        }}
      />
    )
  }

  const title = inspectorTitle(selection, runir, terms, surtr, idunn, skatt)
  const showSurtrForm = selection.kind === 'new-surtr' || selection.kind === 'surtr'
  const showIdunnForm = selection.kind === 'new-idunn' || selection.kind === 'idunn'
  const showSkattForm =
    selection.kind === 'new-skatt' ||
    selection.kind === 'skatt' ||
    selection.kind === 'skatt-run'

  const showSave = showSurtrForm || showIdunnForm || showSkattForm
  const isNew =
    selection.kind === 'new-surtr' ||
    selection.kind === 'new-idunn' ||
    selection.kind === 'new-skatt' ||
    selection.kind === 'skatt-run'

  const saveLabel =
    selection.kind === 'surtr'
      ? 'Save changes'
      : selection.kind === 'idunn'
        ? 'Save changes'
        : selection.kind === 'skatt'
          ? 'Save changes'
          : selection.kind === 'new-surtr'
            ? `Add ${terms.surtrSingular}`
            : selection.kind === 'new-idunn'
              ? `Add ${terms.idunnSingular}`
              : `Add ${terms.skattSingular}`

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Audr" title={title} />
      </InspectorChrome>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        {showSurtrForm ? (
          <InlineSurtrForm
            key={
              selection.kind === 'surtr'
                ? selection.id
                : `new-surtr:${selection.kind === 'new-surtr' ? (selection.runId ?? '') : ''}`
            }
            surtr={surtr}
            defaultRunId={selection.kind === 'new-surtr' ? selection.runId : undefined}
            tags={runir}
            formId={BURN_FORM_ID}
            saveActionRef={saveActionRef}
            onSaved={onSaved}
          />
        ) : null}

        {showIdunnForm ? (
          <InlineIdunnForm
            key={
              selection.kind === 'idunn'
                ? selection.id
                : 'new-idunn'
            }
            idunn={idunn}
            tags={runir}
            formId={SUPPLYLINE_FORM_ID}
            saveActionRef={saveActionRef}
            onSaved={onSaved}
          />
        ) : null}

        {showSkattForm ? (
          <>
            <InlineSkattForm
              key={
                selection.kind === 'skatt'
                  ? selection.id
                  : selection.kind === 'skatt-run'
                    ? `skatt-run:${selection.runId}`
                    : `new-skatt:${selection.kind === 'new-skatt' ? (selection.runId ?? '') : ''}`
              }
              skatt={skatt}
              defaultRunId={
                selection.kind === 'skatt-run'
                  ? selection.runId
                  : selection.kind === 'new-skatt'
                    ? selection.runId
                    : undefined
              }
              runir={runir}
              month={month}
              year={year}
              formId={CACHE_FORM_ID}
              saveActionRef={saveActionRef}
              onSaved={onSaved}
            />
            {selection.kind === 'skatt' && skatt ? (
              <>
                <div className="border-t border-border" />
                <AudrSkattAllocationPanel
                  skatt={skatt}
                  surtrItems={skattRunSurtr}
                  idunnItems={skattIdunn}
                  runir={runir}
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

      {selection.kind === 'surtr' && surtr ? (
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
                  Remove {terms.surtrSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.surtrSingular.toLowerCase()}?`}
            description={<>This will permanently remove &ldquo;{surtr.name}&rdquo; and any attached receipt.</>}
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteFjallSurtr(surtr.id)
                setConfirmDelete(false)
                onDeleted()
              } finally {
                setDeleting(false)
              }
            }}
          />
        </>
      ) : null}

      {selection.kind === 'idunn' && idunn ? (
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
                  Remove {terms.idunnSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.idunnSingular.toLowerCase()}?`}
            description={<>This will permanently remove &ldquo;{idunn.name}&rdquo;.</>}
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteFjallIdunn(idunn.id)
                setConfirmDelete(false)
                onDeleted()
              } finally {
                setDeleting(false)
              }
            }}
          />
        </>
      ) : null}

      {selection.kind === 'skatt' && skatt ? (
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
                  Remove {terms.skattSingular.toLowerCase()}
                </>
              )}
            </Button>
          </div>
          <ConfirmDialog
            open={confirmDelete}
            title={`Remove ${terms.skattSingular.toLowerCase()}?`}
            description={
              <>
                Remove the {terms.skattSingular.toLowerCase()} limit for{' '}
                {runShortLabel(skatt.runId, runir, skatt)} this month?
              </>
            }
            confirmLabel="Remove"
            confirmVariant="destructive"
            onCancel={() => setConfirmDelete(false)}
            onConfirm={async () => {
              setDeleting(true)
              try {
                await deleteFjallSkatt(skatt.id)
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

function inspectorTitle(
  selection: AudrSelection,
  runir: AudrRun[],
  terms: Terms,
  surtr?: FjallSurtr,
  idunn?: FjallIdunn,
  skatt?: FjallSkattUtilization,
): string {
  switch (selection.kind) {
    case 'new-surtr':
      return `Add ${terms.surtrSingular}`
    case 'surtr':
      return surtr?.name ?? terms.surtrSingular
    case 'new-idunn':
      return `Add ${terms.idunnSingular}`
    case 'idunn':
      return idunn?.name ?? terms.idunnSingular
    case 'new-skatt':
      return `Add ${terms.skattSingular}`
    case 'skatt-run':
      return `Add ${terms.skattSingular}`
    case 'skatt':
      return runShortLabel(skatt?.runId ?? '', runir, skatt) || terms.skatt
    default:
      return terms.audr
  }
}

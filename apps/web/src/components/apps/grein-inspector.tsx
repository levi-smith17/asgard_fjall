import { useState } from 'react'
import type { FjallGreinView } from '@/lib/data-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { SwitchField } from '@/components/core/ui/switch-field'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import {
  greinPageOptions,
  resolveGreinHiddenPages,
  type GreinPageId,
} from '@/lib/grein-visibility'

export function GreinInspector({
  grein,
  isNew,
  title,
  onBack,
  onSave,
  onDelete,
  isSaving,
}: {
  grein: FjallGreinView | null
  isNew: boolean
  title?: string
  onBack: () => void
  onSave: (values: { name: string; hiddenPages: GreinPageId[] }) => Promise<void>
  onDelete: () => Promise<void>
  isSaving: boolean
}) {
  const terms = useTerms()
  const [name, setName] = useState(grein?.name ?? '')
  const [hiddenPages, setHiddenPages] = useState<GreinPageId[]>(() =>
    grein ? resolveGreinHiddenPages(grein) : [],
  )
  const [deleteOpen, setDeleteOpen] = useState(false)
  const headerTitle = title ?? (isNew ? `New ${terms.greinSingular}` : `Edit ${terms.greinSingular}`)
  const pageOptions = greinPageOptions(terms)

  function togglePage(page: GreinPageId, visible: boolean) {
    setHiddenPages((current) =>
      visible ? current.filter((id) => id !== page) : [...current.filter((id) => id !== page), page],
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InspectorFormHeader title={headerTitle} icon={ASGARD_ENTITY_ICONS.greinar} onBack={onBack} />
      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Research" />
        </label>

        <div className="space-y-2 rounded-lg border border-border p-3">
          <div className="space-y-0.5">
            <p className="text-xs font-semibold text-foreground">Page Visibility</p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Choose where this {terms.greinSingular.toLowerCase()} appears. Turn a page off to
              exclude it there.
            </p>
          </div>
          <div className="space-y-1 border-t border-border pt-2">
            {pageOptions.map((page) => (
              <SwitchField
                key={page.id}
                label={page.label}
                checked={!hiddenPages.includes(page.id)}
                onCheckedChange={(visible) => togglePage(page.id, visible)}
              />
            ))}
          </div>
        </div>
      </div>
      <InspectorFormActions
        isNew={isNew}
        isSaving={isSaving}
        canSave={!!name.trim()}
        createLabel={`Create ${terms.greinSingular}`}
        saveLabel="Save"
        deleteLabel={`Delete ${terms.greinSingular.toLowerCase()}`}
        onSave={() => void onSave({ name: name.trim(), hiddenPages })}
        showDelete={!isNew}
        onDelete={() => setDeleteOpen(true)}
        className="px-4"
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${terms.greinSingular.toLowerCase()}`}
        description={`Delete "${grein?.name}"? Laufar in this grein will be unassigned.`}
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

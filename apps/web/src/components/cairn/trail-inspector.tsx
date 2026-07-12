import { useState } from 'react'
import type { CairnTrailView } from '@/lib/cairn-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import { InspectorFormActions, InspectorFormHeader } from '@/components/core/ui/inspector-form-actions'
import { useTerms } from '@/hooks/use-terminology'

export function TrailInspector({
  trail, isNew, title, onBack, onSave, onDelete, isSaving,
}: {
  trail: CairnTrailView | null; isNew: boolean; title?: string; onBack: () => void; onSave: (name: string) => Promise<void>; onDelete: () => Promise<void>; isSaving: boolean
}) {
  const terms = useTerms()
  const [name, setName] = useState(trail?.name ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const headerTitle = title ?? (isNew ? `New ${terms.greinSingular}` : `Edit ${terms.greinSingular}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InspectorFormHeader title={headerTitle} onBack={onBack} />
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Research" />
        </label>
      </div>
      <InspectorFormActions isNew={isNew} isSaving={isSaving} canSave={name.trim().length > 0} createLabel={`Create ${terms.greinSingular}`} saveLabel={`Save ${terms.greinSingular}`} deleteLabel={`Delete ${terms.greinSingular}`} showDelete={!isNew} onSave={() => void onSave(name.trim())} onDelete={() => setDeleteOpen(true)} />
      <ConfirmDialog open={deleteOpen} title={`Delete ${terms.greinSingular}?`} description="This will permanently remove this grein and its data." confirmLabel="Delete" confirmVariant="destructive" onCancel={() => setDeleteOpen(false)} onConfirm={() => { setDeleteOpen(false); void onDelete() }} />
    </div>
  )
}

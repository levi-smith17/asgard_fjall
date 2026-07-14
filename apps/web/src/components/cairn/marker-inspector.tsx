import { useState } from 'react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import { InspectorFormActions, InspectorFormHeader } from '@/components/core/ui/inspector-form-actions'
import { MarkerColorSwatch, PRESET_COLORS } from '@/components/cairn/markers-list'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { cn } from '@/lib/utils'

export function MarkerInspector({
  marker, isNew, parentPrefix, title, onBack, onSave, onDelete, isSaving,
}: {
  marker: CairnMarkerView | null; isNew: boolean; parentPrefix?: string | null; title?: string; onBack: () => void; onSave: (values: { name: string; color: string; icon: string | null }) => Promise<void>; onDelete: () => Promise<void>; isSaving: boolean
}) {
  const terms = useTerms()
  const [segment, setSegment] = useState(parentPrefix ? '' : marker?.name.split('/').pop() ?? '')
  const [color, setColor] = useState(marker?.color ?? PRESET_COLORS[5])
  const [icon, setIcon] = useState(marker?.icon ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)
  const fullName = parentPrefix ? `${parentPrefix}/${segment.trim()}` : segment.trim()
  const headerTitle = title ?? (isNew ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InspectorFormHeader title={headerTitle} icon={ASGARD_ENTITY_ICONS.runir} onBack={onBack} />
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        {parentPrefix ? <p className="text-xs text-muted-foreground">Parent: <span className="font-medium">{parentPrefix}</span></p> : null}
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          <Input value={segment} onChange={(e) => setSegment(e.target.value)} placeholder="tag-name" />
          {parentPrefix ? <p className="text-xs text-muted-foreground">Full: {fullName || '…'}</p> : null}
        </label>
        <div className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Color</span>
          <div className="flex flex-wrap gap-2 pt-1">
            {PRESET_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => setColor(c)} className={cn('h-6 w-6 rounded-full border-2 transition-all', color === c ? 'border-foreground scale-110' : 'border-transparent hover:scale-105')} style={{ backgroundColor: c }} />
            ))}
          </div>
          <Input value={color} onChange={(e) => setColor(e.target.value)} placeholder="#6366f1" className="mt-1" />
        </div>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Lucide icon (optional)</span>
          <Input value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Tag" />
        </label>
        {color ? <div className="flex items-center gap-2 text-xs"><MarkerColorSwatch color={color} /><span className="text-muted-foreground">Preview</span></div> : null}
      </div>
      <InspectorFormActions isNew={isNew} isSaving={isSaving} canSave={fullName.trim().length > 0 && color.trim().length > 0} createLabel={`Create ${terms.runSingular}`} saveLabel={`Save ${terms.runSingular}`} deleteLabel={`Delete ${terms.runSingular}`} showDelete={!isNew} onSave={() => void onSave({ name: fullName.trim(), color: color.trim(), icon: icon.trim() || null })} onDelete={() => setDeleteOpen(true)} />
      <ConfirmDialog open={deleteOpen} title={`Delete ${terms.runSingular}?`} description="This will permanently remove this marker." confirmLabel="Delete" confirmVariant="destructive" onCancel={() => setDeleteOpen(false)} onConfirm={() => { setDeleteOpen(false); void onDelete() }} />
    </div>
  )
}

import { useState } from 'react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { MarkerColorSwatch, PRESET_COLORS } from '@/components/cairn/markers-list'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import { cn } from '@/lib/utils'

export function MarkerInspector({
  marker,
  isNew,
  parentPrefix,
  title,
  onBack,
  onSave,
  onDelete,
  isSaving,
}: {
  marker: CairnMarkerView | null
  isNew: boolean
  parentPrefix?: string | null
  title?: string
  onBack: () => void
  onSave: (values: { name: string; color: string; icon: string | null }) => Promise<void>
  onDelete: () => Promise<void>
  isSaving: boolean
}) {
  const terms = useTerms()
  const [segment, setSegment] = useState(
    parentPrefix ? '' : marker?.name.split('/').pop() ?? '',
  )
  const [color, setColor] = useState(marker?.color ?? PRESET_COLORS[5])
  const [icon, setIcon] = useState(marker?.icon ?? '')
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fullName = parentPrefix ? `${parentPrefix}/${segment.trim()}` : segment.trim()
  const headerTitle = title ?? (isNew ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InspectorFormHeader title={headerTitle} icon={ASGARD_ENTITY_ICONS.runir} onBack={onBack} />
      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          {parentPrefix ? (
            <div className="flex items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">{parentPrefix}/</span>
              <Input value={segment} onChange={(event) => setSegment(event.target.value)} />
            </div>
          ) : (
            <Input
              value={segment}
              onChange={(event) => setSegment(event.target.value)}
              placeholder="AWS/Compute"
            />
          )}
        </label>

        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Color</span>
          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setColor(preset)}
                className={cn(
                  'rounded-full border-2 p-0.5',
                  color === preset ? 'border-primary' : 'border-transparent',
                )}
                aria-label={`Color ${preset}`}
              >
                <MarkerColorSwatch color={preset} />
              </button>
            ))}
          </div>
        </div>

        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Icon (optional)</span>
          <Input
            value={icon}
            onChange={(event) => setIcon(event.target.value)}
            placeholder="Tag"
          />
        </label>
      </div>
      <InspectorFormActions
        isNew={isNew}
        isSaving={isSaving}
        canSave={!!fullName}
        createLabel={`Create ${terms.runSingular}`}
        saveLabel="Save"
        deleteLabel={`Delete ${terms.runSingular.toLowerCase()}`}
        onSave={() =>
          void onSave({
            name: fullName,
            color,
            icon: icon.trim() ? icon.trim() : null,
          })
        }
        showDelete={!isNew}
        onDelete={() => setDeleteOpen(true)}
        className="px-4"
      />

      <ConfirmDialog
        open={deleteOpen}
        title={`Delete ${terms.runSingular.toLowerCase()}`}
        description={`Delete "${marker?.name}"?`}
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

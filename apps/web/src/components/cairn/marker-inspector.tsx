import { useState } from 'react'
import type { CairnMarkerView } from '@/lib/cairn-types'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Input } from '@/components/core/ui/input'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { MarkerColorField } from '@/components/cairn/marker-color-field'
import { PRESET_COLORS } from '@/components/cairn/markers-list'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'

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
  const markerParts = marker?.name.split('/') ?? []
  const derivedParent =
    !isNew && !parentPrefix && markerParts.length > 1
      ? markerParts.slice(0, -1).join('/')
      : null
  const effectiveParent = parentPrefix || derivedParent
  const [segment, setSegment] = useState(
    effectiveParent ? (marker?.name.split('/').pop() ?? '') : (marker?.name ?? ''),
  )
  const [color, setColor] = useState(marker?.color ?? PRESET_COLORS[12])
  const [deleteOpen, setDeleteOpen] = useState(false)

  const fullName = effectiveParent ? `${effectiveParent}/${segment.trim()}` : segment.trim()
  const headerTitle = title ?? (isNew ? `New ${terms.runSingular}` : `Edit ${terms.runSingular}`)

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <InspectorFormHeader title={headerTitle} icon={ASGARD_ENTITY_ICONS.runir} onBack={onBack} />
      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-4 py-4">
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Name</span>
          {effectiveParent ? (
            <div className="flex min-w-0 items-center gap-2">
              <span className="shrink-0 text-xs text-muted-foreground">{effectiveParent}/</span>
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

        <MarkerColorField color={color} onChange={setColor} />
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
            icon: marker?.icon ?? null,
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

import { useState } from 'react'
import type { FjallTrailView } from '@/lib/data-types'
import { Input } from '@/components/core/ui/input'
import { InspectorFormActions } from '@/components/core/ui/inspector-form-actions'
import { Select } from '@/components/core/ui/select'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

type GreinMode = 'existing' | 'new'

export function SogurNewSagaInspector({
  greinar,
  onCreate,
  onCancel: _onCancel,
  creating,
}: {
  greinar: FjallTrailView[]
  onCreate: (input: { trailId?: string; newGreinName?: string }) => void
  onCancel: () => void
  creating?: boolean
}) {
  const terms = useTerms()
  const [mode, setMode] = useState<GreinMode>(greinar.length > 0 ? 'existing' : 'new')
  const [trailId, setTrailId] = useState('')
  const [newGreinName, setNewGreinName] = useState('')

  const canCreate =
    !creating &&
    (mode === 'existing' ? Boolean(trailId) : Boolean(newGreinName.trim()))

  function handleCreate() {
    if (mode === 'existing') onCreate({ trailId })
    else onCreate({ newGreinName: newGreinName.trim() })
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle
          eyebrow={`New ${terms.notesSingular.toLowerCase()}`}
          title={`Choose or create a ${terms.greinSingular.toLowerCase()}`}
        />
      </InspectorChrome>

      <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-5 py-4">
        <p className="text-xs text-muted-foreground">
          Each {terms.greinSingular.toLowerCase()} can have one {terms.notesSingular.toLowerCase()}.
        </p>
        <div className="flex rounded-md border border-border p-0.5">
          <button
            type="button"
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors',
              mode === 'existing' ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
            onClick={() => setMode('existing')}
            disabled={greinar.length === 0}
          >
            Existing
          </button>
          <button
            type="button"
            className={cn(
              'flex-1 rounded px-2 py-1.5 text-xs font-medium transition-colors',
              mode === 'new' ? 'bg-muted text-foreground' : 'text-muted-foreground',
            )}
            onClick={() => setMode('new')}
          >
            New
          </button>
        </div>

        {mode === 'existing' ? (
          greinar.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No {terms.greinar.toLowerCase()} are available without a{' '}
              {terms.notesSingular.toLowerCase()} yet. Create a new{' '}
              {terms.greinSingular.toLowerCase()} instead.
            </p>
          ) : (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground" htmlFor="sogur-grein-select">
                {terms.greinSingular}
              </label>
              <Select
                id="sogur-grein-select"
                options={greinar.map((trail) => ({ value: trail.id, label: trail.name }))}
                value={trailId}
                onChange={setTrailId}
                placeholder={`Select ${terms.greinSingular.toLowerCase()}…`}
              />
            </div>
          )
        ) : (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground" htmlFor="sogur-new-grein-name">
              {terms.greinSingular} name
            </label>
            <Input
              id="sogur-new-grein-name"
              value={newGreinName}
              onChange={(event) => setNewGreinName(event.target.value)}
              placeholder="Research"
            />
          </div>
        )}
      </div>

      <InspectorFormActions
        isNew
        isSaving={creating}
        canSave={canCreate}
        createLabel={`Create ${terms.notesSingular.toLowerCase()}`}
        onSave={handleCreate}
      />
    </div>
  )
}

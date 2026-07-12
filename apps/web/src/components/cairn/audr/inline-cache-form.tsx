import { useState, useId, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/core/ui/input'
import { Button } from '@/components/core/ui/button'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { saveCairnCache } from '@/lib/cairn-api'
import { useFormStatus } from '@/hooks/use-form-status'
import type { CairnCacheUtilization } from '@/lib/cairn-types'
import { useTerms } from '@/hooks/use-terminology'
import type { AudrSaveActionRef } from './inline-burn-form'

interface Props {
  cache?: CairnCacheUtilization
  defaultMarkerId?: string
  markers: { id: string; name: string; color: string; icon?: string | null }[]
  month: number
  year: number
  formId?: string
  saveActionRef?: AudrSaveActionRef
  onSaved: () => void
  onCancel?: () => void
}

export function InlineCacheForm({
  cache,
  defaultMarkerId,
  markers,
  month,
  year,
  formId: formIdProp,
  saveActionRef,
  onSaved,
  onCancel,
}: Props) {
  const terms = useTerms()
  const generatedId = useId()
  const formId = formIdProp ?? generatedId
  const { saving, handleSubmit } = useFormStatus()
  const [markerId, setMarkerId] = useState(cache?.markerId ?? defaultMarkerId ?? '')
  const [limit, setLimit] = useState(cache?.limit != null ? String(cache.limit) : '')

  async function save() {
    if (!markerId || !limit) {
      toast.error(`Select a ${terms.runSingular.toLowerCase()} and enter a limit.`)
      return
    }
    await handleSubmit(async () => {
      await saveCairnCache({
        id: cache?.id,
        markerId,
        limit: parseFloat(limit),
        month,
        year,
      })
      onSaved()
    })
  }

  useEffect(() => {
    if (!saveActionRef) return
    saveActionRef.current = save
    return () => {
      saveActionRef.current = null
    }
  })

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    await save()
  }

  const form = (
    <form id={formId} onSubmit={onSubmit} className="space-y-4 px-5 py-4 text-sm">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.runSingular}</span>
        <MarkerPicker
          markers={markers}
          selected={markerId ? [markerId] : []}
          onChange={(ids) => setMarkerId(ids[0] ?? '')}
          placeholder={`Select ${terms.runSingular.toLowerCase()}…`}
          singleSelect
          initialPath={['Provisions']}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Monthly limit</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="500.00"
          value={limit}
          onChange={(e) => setLimit(e.target.value)}
        />
      </label>
      {saving ? <p className="text-xs text-muted-foreground">Saving…</p> : null}
    </form>
  )

  if (onCancel) {
    return (
      <>
        {form}
        <div className="flex justify-end gap-2 border-t p-4 py-2">
          <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="button" size="sm" disabled={saving} className="h-7 text-xs" onClick={() => void save()}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </div>
      </>
    )
  }

  return form
}

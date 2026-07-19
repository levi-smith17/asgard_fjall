import { useState, useId, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/core/ui/input'
import { Button } from '@/components/core/ui/button'
import { RunPicker } from '@/components/apps/run-picker'
import { saveFjallSkatt } from '@/lib/data-api'
import { useFormStatus } from '@/hooks/use-form-status'
import type { FjallSkattUtilization } from '@/lib/data-types'
import { getDefaultSjodrId } from '@/lib/audr-default-sjodr'
import { useTerms } from '@/hooks/use-terminology'
import type { AudrSaveActionRef } from './inline-surtr-form'
import { FundPicker } from './fund-picker'

interface Props {
  skatt?: FjallSkattUtilization
  defaultRunId?: string
  runir: { id: string; name: string; color: string; icon?: string | null }[]
  month: number
  year: number
  formId?: string
  saveActionRef?: AudrSaveActionRef
  onSaved: () => void
  onCancel?: () => void
}

export function InlineSkattForm({
  skatt,
  defaultRunId,
  runir,
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
  const [runId, setRunId] = useState(skatt?.runId ?? defaultRunId ?? '')
  const [limit, setLimit] = useState(skatt?.limit != null ? String(skatt.limit) : '')
  const [fundId, setFundId] = useState<string | null>(
    () => skatt?.fundId ?? (skatt ? null : getDefaultSjodrId()),
  )

  useEffect(() => {
    setRunId(skatt?.runId ?? defaultRunId ?? '')
    setLimit(skatt?.limit != null ? String(skatt.limit) : '')
    setFundId(skatt?.fundId ?? (skatt ? null : getDefaultSjodrId()))
  }, [skatt?.id, defaultRunId])

  async function save() {
    if (!runId || !limit) {
      toast.error(`Select a ${terms.runSingular.toLowerCase()} and enter a limit.`)
      return
    }
    await handleSubmit(async () => {
      await saveFjallSkatt({
        id: skatt?.id,
        runId,
        limit: parseFloat(limit),
        month,
        year,
        fundId,
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
        <RunPicker
          runir={runir}
          selected={runId ? [runId] : []}
          onChange={(ids) => setRunId(ids[0] ?? '')}
          placeholder={`Select ${terms.runSingular.toLowerCase()}…`}
          singleSelect
          initialPath={['Audr']}
        />
      </label>
      <FundPicker value={fundId} onChange={setFundId} />
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

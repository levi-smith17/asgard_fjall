import { useState, useId, useEffect } from 'react'
import { toast } from 'sonner'
import { Input } from '@/components/core/ui/input'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { MarkerPicker } from '@/components/cairn/marker-picker'
import { saveCairnSupplyline } from '@/lib/cairn-api'
import { useFormStatus } from '@/hooks/use-form-status'
import { toMarkerId } from '@/lib/embedded-markers'
import type { CairnSupplyline } from '@/lib/cairn-types'
import { toDateInputValue, todayDateInputValue } from '@/lib/date-input'
import { getDefaultSjodrId } from '@/lib/audr-default-sjodr'
import { useTerms } from '@/hooks/use-terminology'
import type { AudrSaveActionRef } from './inline-burn-form'
import { FundPicker } from './fund-picker'

const BILLING_CYCLES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const
const CYCLE_LABELS: Record<string, string> = {
  WEEKLY: 'Weekly',
  BIWEEKLY: 'Bi-weekly',
  MONTHLY: 'Monthly',
  QUARTERLY: 'Quarterly',
  ANNUALLY: 'Annually',
}

function normalizeOptionalUrl(value: string): string | null {
  const trimmed = value.trim()
  if (!trimmed) return null
  try {
    const parsed = new URL(trimmed.includes('://') ? trimmed : `https://${trimmed}`)
    return parsed.toString()
  } catch {
    return null
  }
}

interface Props {
  supplyline?: CairnSupplyline
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  formId?: string
  saveActionRef?: AudrSaveActionRef
  onSaved: () => void
  onCancel?: () => void
}

export function InlineSupplylineForm({
  supplyline,
  tags,
  formId: formIdProp,
  saveActionRef,
  onSaved,
  onCancel,
}: Props) {
  const terms = useTerms()
  const generatedId = useId()
  const formId = formIdProp ?? generatedId
  const { saving, handleSubmit } = useFormStatus()
  const [name, setName] = useState(supplyline?.name ?? '')
  const [amount, setAmount] = useState(String(supplyline?.amount ?? 0))
  const [billingCycle, setBillingCycle] = useState(supplyline?.billingCycle ?? 'MONTHLY')
  const [nextRenewal, setNextRenewal] = useState(() =>
    supplyline?.nextRenewal
      ? toDateInputValue(supplyline.nextRenewal)
      : todayDateInputValue(),
  )
  const [url, setUrl] = useState(supplyline?.url ?? '')
  const [notes, setNotes] = useState(supplyline?.notes ?? '')
  const [fundId, setFundId] = useState<string | null>(
    () => supplyline?.fundId ?? (supplyline ? null : getDefaultSjodrId()),
  )
  const [tagIds, setTagIds] = useState(
    (supplyline?.markers?.map((t) => toMarkerId(t)).filter(Boolean) as string[]) ?? [],
  )

  useEffect(() => {
    setName(supplyline?.name ?? '')
    setAmount(String(supplyline?.amount ?? 0))
    setBillingCycle(supplyline?.billingCycle ?? 'MONTHLY')
    setNextRenewal(
      supplyline?.nextRenewal
        ? toDateInputValue(supplyline.nextRenewal)
        : todayDateInputValue(),
    )
    setUrl(supplyline?.url ?? '')
    setNotes(supplyline?.notes ?? '')
    setFundId(supplyline?.fundId ?? (supplyline ? null : getDefaultSjodrId()))
    setTagIds(
      (supplyline?.markers?.map((t) => toMarkerId(t)).filter(Boolean) as string[]) ?? [],
    )
  }, [supplyline?.id])

  async function save() {
    if (!name.trim()) {
      toast.error('Name is required.')
      return
    }
    if (!nextRenewal) {
      toast.error('Next renewal date is required.')
      return
    }
    const normalizedUrl = normalizeOptionalUrl(url)
    if (url.trim() && !normalizedUrl) {
      toast.error('Enter a valid URL or leave the field empty.')
      return
    }

    try {
      await handleSubmit(async () => {
        await saveCairnSupplyline({
          id: supplyline?.id,
          name: name.trim(),
          amount: parseFloat(amount) || 0,
          billingCycle,
          nextRenewal,
          url: normalizedUrl,
          notes: notes.trim() || null,
          markerIds: tagIds,
          fundId,
          active: supplyline?.active ?? true,
        })
        onSaved()
      })
    } catch {
      // useFormStatus already surfaced the error toast
    }
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
    <form id={formId} onSubmit={onSubmit} className="min-w-0 space-y-4 px-5 py-4 text-sm">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Name</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Name" />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Amount</span>
        <Input
          type="number"
          min="0"
          step="0.01"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Billing cycle</span>
        <Select
          value={billingCycle}
          onChange={setBillingCycle}
          options={BILLING_CYCLES.map((c) => ({ value: c, label: CYCLE_LABELS[c] }))}
        />
      </label>
      <label className="block min-w-0 space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Next renewal</span>
        <Input
          type="date"
          className="min-w-0 max-w-full"
          value={nextRenewal}
          onChange={(e) => setNextRenewal(e.target.value)}
        />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.runSingular}</span>
        <MarkerPicker
          markers={tags}
          selected={tagIds}
          onChange={setTagIds}
          placeholder={`Select ${terms.runSingular.toLowerCase()}…`}
          singleSelect
          initialPath={['Provisions']}
        />
      </label>
      <FundPicker value={fundId} onChange={setFundId} />
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">URL</span>
        <Input placeholder="Optional URL" value={url} onChange={(e) => setUrl(e.target.value)} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <Input placeholder="Optional notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
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

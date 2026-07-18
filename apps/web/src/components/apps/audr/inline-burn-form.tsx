import { useState, useRef, useEffect, useId, type MutableRefObject } from 'react'
import { ImagePlus, Loader2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Input } from '@/components/core/ui/input'
import { Button } from '@/components/core/ui/button'
import { DatePicker } from '@/components/core/ui/date-picker'
import { RunPicker } from '@/components/apps/run-picker'
import {
  fetchFjallBurnReceiptUrl,
  saveFjallBurn,
  uploadFjallBurnReceipt,
} from '@/lib/data-api'
import { useFormStatus } from '@/hooks/use-form-status'
import { toRunId } from '@/lib/embedded-runir'
import type { FjallBurn } from '@/lib/data-types'
import { toDateInputValue, todayDateInputValue } from '@/lib/date-input'
import { getDefaultSjodrId } from '@/lib/audr-default-sjodr'
import { useTerms } from '@/hooks/use-terminology'
import { FundPicker } from './fund-picker'

export type AudrSaveActionRef = MutableRefObject<(() => Promise<void>) | null>

interface Props {
  burn?: FjallBurn
  defaultRunId?: string
  tags: { id: string; name: string; color: string; icon?: string | null }[]
  formId?: string
  saveActionRef?: AudrSaveActionRef
  onSaved: () => void
  onCancel?: () => void
}

export function InlineBurnForm({
  burn,
  defaultRunId,
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
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [name, setName] = useState(burn?.name ?? '')
  const [amount, setAmount] = useState(String(burn?.amount ?? 0))
  const [date, setDate] = useState(() =>
    burn?.date ? toDateInputValue(burn.date) : todayDateInputValue(),
  )
  const [notes, setNotes] = useState(burn?.notes ?? '')
  const [fundId, setFundId] = useState<string | null>(
    () => burn?.fundId ?? (burn ? null : getDefaultSjodrId()),
  )
  const [tagIds, setTagIds] = useState(
  () =>
    (burn?.runir?.map((t) => toRunId(t)).filter(Boolean) as string[]) ??
    (defaultRunId ? [defaultRunId] : []),
  )
  const [receiptKey, setReceiptKey] = useState<string | null>(burn?.receiptUrl ?? null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [receiptViewUrl, setReceiptViewUrl] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [dragging, setDragging] = useState(false)

  // Rehydrate when the selected Surtr arrives/changes (mobile sheet often keeps the form mounted).
  useEffect(() => {
    setName(burn?.name ?? '')
    setAmount(String(burn?.amount ?? 0))
    setDate(burn?.date ? toDateInputValue(burn.date) : todayDateInputValue())
    setNotes(burn?.notes ?? '')
    setFundId(burn?.fundId ?? (burn ? null : getDefaultSjodrId()))
    setTagIds(
      (burn?.runir?.map((t) => toRunId(t)).filter(Boolean) as string[]) ??
        (defaultRunId ? [defaultRunId] : []),
    )
    setReceiptKey(burn?.receiptUrl ?? null)
    setReceiptPreview(null)
    setReceiptViewUrl(null)
    // Intentionally keyed on id so background refetches do not wipe in-progress edits.
  }, [burn?.id, defaultRunId])

  useEffect(() => {
    if (burn?.receiptUrl && !receiptPreview) {
      fetchFjallBurnReceiptUrl(burn.receiptUrl).then(setReceiptViewUrl).catch(() => {})
    }
  }, [burn?.receiptUrl, receiptPreview])

  async function uploadFile(file: File) {
    const localUrl = URL.createObjectURL(file)
    setReceiptPreview(localUrl)
    setReceiptViewUrl(null)
    setUploading(true)
    try {
      const key = await uploadFjallBurnReceipt(file)
      setReceiptKey(key)
    } catch (error) {
      setReceiptPreview(null)
      setReceiptKey(null)
      toast.error(error instanceof Error ? error.message : 'Receipt upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function save() {
    if (!name.trim()) {
      toast.error('Description is required.')
      return
    }
    if (uploading) {
      toast.error('Wait for the receipt upload to finish')
      return
    }
    await handleSubmit(async () => {
      await saveFjallBurn({
        id: burn?.id,
        name: name.trim(),
        amount: parseFloat(amount) || 0,
        date,
        notes: notes || null,
        runIds: tagIds,
        receiptUrl: receiptKey,
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

  const receiptSrc = receiptPreview ?? receiptViewUrl

  const form = (
    <form id={formId} onSubmit={onSubmit} className="min-w-0 space-y-4 px-5 py-4 text-sm">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Description</span>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Description" />
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
      <label className="block min-w-0 space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Date</span>
        <DatePicker value={date} onChange={setDate} />
      </label>
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">{terms.runSingular}</span>
        <RunPicker
          runir={tags}
          selected={tagIds}
          onChange={setTagIds}
          placeholder={`Select ${terms.runSingular.toLowerCase()}…`}
          singleSelect
          initialPath={['Audr']}
        />
      </label>
      <FundPicker value={fundId} onChange={setFundId} />
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Notes</span>
        <Input
          placeholder="Optional notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>
      <div className="space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Receipt</span>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) uploadFile(f)
          }}
        />
        {receiptSrc ? (
          <div className="relative w-full overflow-hidden rounded-lg border bg-muted">
            <img src={receiptSrc} alt="Receipt" className="max-h-64 w-full object-contain" />
            <button
              type="button"
              onClick={() => {
                setReceiptKey(null)
                setReceiptPreview(null)
                setReceiptViewUrl(null)
              }}
              className="absolute right-2 top-2 rounded-full border bg-background/80 p-1 text-muted-foreground backdrop-blur hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
            {uploading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-xs text-muted-foreground backdrop-blur-sm">
                Uploading…
              </div>
            ) : null}
          </div>
        ) : (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragging(true)
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragging(false)
              const f = e.dataTransfer.files?.[0]
              if (f?.type.startsWith('image/')) uploadFile(f)
            }}
            className={`flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed py-6 text-center transition-colors ${
              dragging
                ? 'border-primary bg-primary/5 text-primary'
                : 'border-border text-muted-foreground hover:border-muted-foreground/50 hover:bg-muted/50'
            }`}
          >
            <ImagePlus className="h-6 w-6" />
            <div className="text-xs">
              <span className="font-medium">Click to upload</span> or drag & drop
            </div>
          </div>
        )}
      </div>
      {saving || uploading ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          {uploading ? 'Uploading receipt…' : 'Saving…'}
        </p>
      ) : null}
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
          <Button type="button" size="sm" className="h-7 text-xs" disabled={saving} onClick={() => void save()}>
            Save
          </Button>
        </div>
      </>
    )
  }

  return form
}

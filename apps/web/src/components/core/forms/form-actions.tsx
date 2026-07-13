import { Button } from '@/components/core/ui/button'
import { Loader2, Save } from 'lucide-react'

interface FormActionsProps {
  saving: boolean
  saved: boolean
  error: boolean
  saveLabel?: string
  formId?: string
  hideAlert?: boolean
  onCancel?: () => void
  buttonClassName?: string
}

export function FormActions({
  saving,
  saved,
  error,
  saveLabel = 'Save',
  formId,
  onCancel,
  buttonClassName,
}: FormActionsProps) {
  return (
    <div className="flex w-full flex-col-reverse items-center justify-end gap-4 md:w-auto md:flex-row">
      {!saving && saved ? (
        <span className="w-full text-xs text-success md:w-auto">Saved successfully.</span>
      ) : null}
      {!saving && error ? (
        <span className="w-full text-xs text-destructive md:w-auto">Something went wrong.</span>
      ) : null}
      {onCancel ? (
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          className={`w-full md:w-auto ${buttonClassName ?? ''}`}
        >
          Cancel
        </Button>
      ) : null}
      <Button
        type="submit"
        form={formId}
        disabled={saving}
        className={`w-full md:w-auto ${buttonClassName ?? ''}`}
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving...' : saveLabel}
      </Button>
    </div>
  )
}

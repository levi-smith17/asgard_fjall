import { useState } from 'react'
import { toast } from 'sonner'

function formatSubmitError(error: unknown): string {
  if (error instanceof Error && error.message.trim()) {
    return error.message
  }
  return 'Something went wrong. Please try again.'
}

export function useFormStatus() {
  const [saving, setSaving] = useState(false)

  async function handleSubmit(action: () => Promise<void>) {
    setSaving(true)
    try {
      await action()
      toast.success('Saved successfully.')
    } catch (error) {
      toast.error(formatSubmitError(error))
      throw error
    } finally {
      setSaving(false)
    }
  }

  return { saving, saved: false, error: false, handleSubmit }
}

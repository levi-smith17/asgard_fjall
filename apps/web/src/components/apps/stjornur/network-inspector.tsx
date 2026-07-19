import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/core/ui/form'
import { Input } from '@/components/core/ui/input'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/core/ui/alert-dialog'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { SF_CONTROL } from './constants'

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  abbreviation: z.string().min(1, 'Abbreviation is required'),
})

type FormValues = z.infer<typeof schema>

export function NetworkInspector({
  network,
  onSave,
  onDelete,
}: {
  network?: { id: string; name: string; abbreviation: string }
  onSave: (name: string, abbreviation: string) => Promise<void>
  onDelete?: () => Promise<void>
}) {
  const isNew = !network
  const [isSaving, setIsSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: network?.name ?? '',
      abbreviation: network?.abbreviation ?? '',
    },
  })

  async function onSubmit(values: FormValues) {
    setIsSaving(true)
    try {
      await onSave(values.name.trim(), values.abbreviation.trim())
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <InspectorFormHeader
        eyebrow="Inspector"
        title={isNew ? 'Add Network' : 'Edit Network'}
        showBack={false}
      />
      <Form {...form}>
        <form
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <div className="min-h-0 min-w-0 flex-1 space-y-4 overflow-y-auto overflow-x-hidden px-5 py-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Network name</FormLabel>
                  <Input className={SF_CONTROL} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="abbreviation"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Abbreviation</FormLabel>
                  <Input className={SF_CONTROL} {...field} />
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <InspectorFormActions
            isNew={isNew}
            isSaving={isSaving}
            createLabel="Create Network"
            saveLabel="Save"
            deleteLabel="Delete Network"
            showDelete={!isNew && Boolean(onDelete)}
            onSave={() => void form.handleSubmit(onSubmit)()}
            onDelete={onDelete ? () => setConfirmDelete(true) : undefined}
          />
        </form>
      </Form>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete network?</AlertDialogTitle>
            <AlertDialogDescription>
              Remove network &quot;{network?.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                void onDelete?.()
                setConfirmDelete(false)
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

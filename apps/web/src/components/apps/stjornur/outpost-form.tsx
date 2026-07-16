import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { createOutpost, updateOutpost, deleteOutpost } from '@/lib/stjornur-api'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/core/ui/form'
import { Input } from '@/components/core/ui/input'
import { PlanetPicker } from '@/components/core/ui/planet-picker'
import { CustomSelect } from '@/components/core/ui/custom-select'
import {
  InspectorFormActions,
  InspectorFormHeader,
} from '@/components/core/ui/inspector-form-actions'
import { useFormStatus } from '@/hooks/use-form-status'
import { toast } from 'sonner'
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
import { SF_CONTROL } from './constants'

const schema = z.object({
  system: z.string().min(1, 'System is required'),
  planet: z.string().min(1, 'Planet is required'),
  parentId: z.string().optional(),
  transferStationLimit: z.string(),
})

type FormValues = z.infer<typeof schema>

interface SystemEntry {
  id: string
  name: string
  planets: { id: string; name: string }[]
}

interface SystemCrudCallbacks {
  onSystemCreate: (name: string) => void
  onSystemRename: (id: string, newName: string) => void
  onSystemDelete: (id: string) => void
  onPlanetCreate: (systemId: string, name: string) => void
  onPlanetRename: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete: (systemId: string, planetId: string) => void
}

interface OutpostFormProps {
  outpost?: any
  networkId: string
  outposts: any[]
  systems: SystemEntry[]
  systemCrudCallbacks: SystemCrudCallbacks
  onDone: () => void
  onRefresh: () => void
}

export function OutpostForm({ outpost, networkId, outposts, systems, systemCrudCallbacks, onDone, onRefresh }: OutpostFormProps) {
  const { saving, handleSubmit } = useFormStatus()
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false)

  const otherOutposts = outposts.filter(
    o => (o.id ?? o.sk?.replace(/^SF#FACILITY#/, '')) !== (outpost?.id ?? outpost?.sk?.replace(/^SF#FACILITY#/, ''))
  )

  const parentOptions = otherOutposts.map(o => ({
    value: o.id ?? o.sk?.replace(/^SF#FACILITY#/, ''),
    label: `${o.planet} (${o.system})`,
  }))

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      system: outpost?.system ?? '',
      planet: outpost?.planet ?? '',
      parentId: outpost?.parentId ?? '',
      transferStationLimit: String(outpost?.transferStationLimit ?? 32),
    },
  })

  async function onSubmit(values: FormValues) {
    await handleSubmit(async () => {
      const payload = {
        system: values.system,
        planet: values.planet,
        parentId: values.parentId || undefined,
        transferStationLimit: parseInt(values.transferStationLimit, 10) || 32,
      }
      if (outpost?.id) {
        await updateOutpost(outpost.id, payload)
        toast.success('Outpost updated.')
      } else {
        await createOutpost({ ...payload, networkId })
        toast.success('Outpost created.')
      }
      onRefresh()
      onDone()
    })
  }

  async function handleDelete() {
    if (!outpost?.id) return
    try {
      await deleteOutpost(outpost.id)
      toast.success('Outpost removed.')
      onRefresh()
      onDone()
    } catch {
      toast.error('Failed to remove outpost.')
    }
  }

  return (
    <>
      <div className="flex h-full flex-col">
        <InspectorFormHeader
          title={outpost ? 'Edit Outpost' : 'Add Outpost'}
          showBack={false}
        />
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <Form {...form}>
            <form id="outpost-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField control={form.control} name="planet" render={({ field }) => (
                <FormItem>
                  <FormLabel>Planet</FormLabel>
                  <PlanetPicker
                    value={field.value}
                    onChange={v => field.onChange(v)}
                    onSystemChange={v => form.setValue('system', v)}
                    systems={systems}
                    allowManageSystems={false}
                    {...systemCrudCallbacks}
                  />
                  <FormMessage />
                  {form.formState.errors.system && (
                    <p className="text-sm font-medium text-destructive">{form.formState.errors.system.message}</p>
                  )}
                </FormItem>
              )} />

              {parentOptions.length > 0 && (
                <FormField control={form.control} name="parentId" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Outpost <span className="text-muted-foreground text-xs font-normal">(optional)</span></FormLabel>
                    <CustomSelect
                      options={[{ value: '', label: 'None (root)' }, ...parentOptions]}
                      value={field.value ?? ''}
                      onChange={field.onChange}
                      placeholder="None (root)"
                      triggerClassName="w-full"
                    />
                    <FormMessage />
                  </FormItem>
                )} />
              )}
              <FormField control={form.control} name="transferStationLimit" render={({ field }) => (
                <FormItem>
                  <FormLabel>Transfer Station Limit</FormLabel>
                  <Input type="number" min={0} max={99} className={SF_CONTROL} {...field} />
                  <FormMessage />
                </FormItem>
              )} />
            </form>
          </Form>
        </div>
        <InspectorFormActions
          isNew={!outpost}
          isSaving={saving}
          createLabel="Add Outpost"
          saveLabel="Save"
          deleteLabel="Delete"
          onSave={() => void form.handleSubmit(onSubmit)()}
          showDelete={!!outpost}
          onDelete={() => setRemoveDialogOpen(true)}
        />
      </div>

      <AlertDialog open={removeDialogOpen} onOpenChange={setRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove outpost</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove{outpost ? ` "${outpost.planet} (${outpost.system})"` : ' this outpost'}? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

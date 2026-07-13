import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import {
  fetchCairnFullSettings,
  fetchCairnStatus,
  saveCairnListedSetting,
  saveCairnPrivacySettings,
} from '@/lib/cairn-api'

export function ThingPrivacySettings() {
  const queryClient = useQueryClient()
  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
  })

  const settingsQuery = useQuery({
    queryKey: ['cairn-full-settings'],
    queryFn: fetchCairnFullSettings,
    enabled: statusQuery.data?.configured === true,
  })

  const privacy = settingsQuery.data?.privacy
  const listed = settingsQuery.data?.account.listed ?? false
  const [manifestVisibility, setManifestVisibility] = useState<'PUBLIC' | 'UNLISTED' | 'PRIVATE'>(
    'PRIVATE',
  )
  const [contactFormEnabled, setContactFormEnabled] = useState(false)
  const [listedValue, setListedValue] = useState(false)

  useEffect(() => {
    if (!privacy) return
    setManifestVisibility(privacy.manifestVisibility)
    setContactFormEnabled(privacy.contactFormEnabled)
    setListedValue(listed)
  }, [privacy, listed])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await saveCairnPrivacySettings({
        manifestVisibility,
        contactFormEnabled,
      })
      await saveCairnListedSetting(listedValue)
    },
    onSuccess: async () => {
      toast.success('Privacy settings saved')
      await queryClient.invalidateQueries({ queryKey: ['cairn-full-settings'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save'),
  })

  if (statusQuery.isLoading) {
    return <FormFieldsSkeleton fields={4} />
  }

  if (!statusQuery.data?.configured) {
    return <CairnNotConfiguredNotice />
  }

  if (settingsQuery.isLoading || !privacy) {
    return <FormFieldsSkeleton fields={4} />
  }

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault()
        saveMutation.mutate()
      }}
    >
      <div className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Manifest</p>

        <ThingSettingRow
          label="Visibility"
          description="Who can view your public Ordstirr page"
          control={
            <Select
              value={manifestVisibility}
              onChange={(value) =>
                setManifestVisibility(value as 'PUBLIC' | 'UNLISTED' | 'PRIVATE')
              }
              options={[
                { value: 'PUBLIC', label: 'Public' },
                { value: 'UNLISTED', label: 'Unlisted' },
                { value: 'PRIVATE', label: 'Private' },
              ]}
              className="w-32"
            />
          }
        />

        <ThingSettingRow
          label="Listed in directory"
          description="Show your profile in the public directory"
          control={
            <Switch checked={listedValue} onCheckedChange={setListedValue} aria-label="Listed" />
          }
        />
      </div>

      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Contact</p>

        <ThingSettingRow
          label="Contact form"
          description="Allow visitors to send messages through your manifest"
          control={
            <Switch
              checked={contactFormEnabled}
              onCheckedChange={setContactFormEnabled}
              aria-label="Contact form"
            />
          }
        />
      </div>

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

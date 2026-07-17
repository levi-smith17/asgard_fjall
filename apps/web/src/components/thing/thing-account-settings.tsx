import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import {
  fetchCairnFullSettings,
  fetchCairnStatus,
  saveCairnAccountSettings,
  saveCairnAppearanceSettings,
  saveCairnPrivacySettings,
} from '@/lib/data-api'

const LANDING_PAGES = [
  { value: '/hlidskjalf', label: 'Hlidskjalf' },
  { value: '/dagatal', label: 'Dagatal' },
  { value: '/sogur', label: 'Sögur' },
  { value: '/audr', label: 'Audr' },
]

export function ThingAccountSettings() {
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

  const account = settingsQuery.data?.account
  const appearance = settingsQuery.data?.appearance
  const privacy = settingsQuery.data?.privacy

  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [sidebarDefault, setSidebarDefault] = useState<'EXPANDED' | 'COLLAPSED'>('EXPANDED')
  const [defaultLandingPage, setDefaultLandingPage] = useState('/hlidskjalf')
  const [dateFormat, setDateFormat] = useState<'MDY' | 'DMY' | 'YMD'>('MDY')
  const [timeFormat, setTimeFormat] = useState<'TWELVE' | 'TWENTYFOUR'>('TWELVE')
  const [publicDefaultTheme, setPublicDefaultTheme] = useState<'SYSTEM' | 'LIGHT' | 'DARK'>('SYSTEM')
  const [publicDefaultPalette, setPublicDefaultPalette] = useState<'fjall' | 'green'>('fjall')
  const [contactFormEnabled, setContactFormEnabled] = useState(false)

  useEffect(() => {
    if (!account || !appearance || !privacy) return
    setName(account.name ?? '')
    setImage(account.image ?? '')
    setSidebarDefault(appearance.sidebarDefault)
    setDefaultLandingPage(
      appearance.defaultLandingPage === '/waypoints' ? '/hlidskjalf' : appearance.defaultLandingPage,
    )
    setDateFormat(appearance.dateFormat)
    setTimeFormat(account.timeFormat)
    setPublicDefaultTheme(appearance.publicDefaultTheme ?? 'SYSTEM')
    setPublicDefaultPalette(appearance.publicDefaultPalette ?? 'fjall')
    setContactFormEnabled(privacy.contactFormEnabled)
  }, [account, appearance, privacy])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveCairnAccountSettings({
          name: name.trim() || null,
          image: image.trim() || null,
          username: account?.username ?? null,
          customDomain: account?.customDomain ?? null,
          timeFormat,
        }),
        saveCairnAppearanceSettings({
          sidebarDefault,
          defaultLandingPage,
          dateFormat,
          publicDefaultTheme,
          publicDefaultPalette,
        }),
        saveCairnPrivacySettings({ contactFormEnabled }),
      ])
    },
    onSuccess: async () => {
      toast.success('Account saved')
      await queryClient.invalidateQueries({ queryKey: ['cairn-full-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['cairn-profile'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save'),
  })

  if (statusQuery.isLoading) {
    return <FormFieldsSkeleton fields={8} />
  }

  if (!statusQuery.data?.configured) {
    return <DataNotConfiguredNotice />
  }

  if (settingsQuery.isLoading || !account || !appearance || !privacy) {
    return <FormFieldsSkeleton fields={8} />
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
        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Full name</span>
          <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
        </label>

        <label className="block space-y-1.5">
          <span className="text-sm font-medium">Avatar URL</span>
          <Input
            value={image}
            onChange={(event) => setImage(event.target.value)}
            placeholder="https://…"
          />
        </label>
      </div>

      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Layout</p>
        <ThingSettingRow
          label="Sidebar default state"
          description="Whether the sidebar starts expanded or collapsed on page load"
          control={
            <Select
              value={sidebarDefault}
              onChange={(value) => setSidebarDefault(value as typeof sidebarDefault)}
              options={[
                { value: 'EXPANDED', label: 'Expanded' },
                { value: 'COLLAPSED', label: 'Collapsed' },
              ]}
              className="w-32"
            />
          }
        />
        <ThingSettingRow
          label="Default landing page"
          description="Which page opens when you sign in"
          control={
            <Select
              value={defaultLandingPage}
              onChange={setDefaultLandingPage}
              options={LANDING_PAGES}
              className="w-40"
            />
          }
        />
      </div>

      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Formatting</p>
        <ThingSettingRow
          label="Date format"
          description="How dates are displayed across the platform"
          control={
            <Select
              value={dateFormat}
              onChange={(value) => setDateFormat(value as typeof dateFormat)}
              options={[
                { value: 'MDY', label: 'MM/DD/YYYY' },
                { value: 'DMY', label: 'DD/MM/YYYY' },
                { value: 'YMD', label: 'YYYY-MM-DD' },
              ]}
              className="w-40"
            />
          }
        />
        <ThingSettingRow
          label="Time format"
          description="How times are displayed across the platform"
          control={
            <Select
              value={timeFormat}
              onChange={(value) => setTimeFormat(value as typeof timeFormat)}
              options={[
                { value: 'TWELVE', label: '12-hour' },
                { value: 'TWENTYFOUR', label: '24-hour' },
              ]}
              className="w-32"
            />
          }
        />
      </div>

      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Public Profile
        </p>
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
        <ThingSettingRow
          label="Public default theme"
          description="Theme visitors see on your public Ordstirr profile"
          control={
            <Select
              value={publicDefaultTheme}
              onChange={(value) => setPublicDefaultTheme(value as typeof publicDefaultTheme)}
              options={[
                { value: 'SYSTEM', label: 'System' },
                { value: 'LIGHT', label: 'Light' },
                { value: 'DARK', label: 'Dark' },
              ]}
              className="w-32"
            />
          }
        />
        <ThingSettingRow
          label="Public default palette"
          description="Color palette visitors see on your public Ordstirr profile"
          control={
            <Select
              value={publicDefaultPalette}
              onChange={(value) => setPublicDefaultPalette(value as typeof publicDefaultPalette)}
              options={[
                { value: 'fjall', label: 'Gold' },
                { value: 'green', label: 'Green' },
              ]}
              className="w-32"
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

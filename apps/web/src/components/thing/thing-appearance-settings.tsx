import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import {
  fetchFjallFullSettings,
  fetchFjallStatus,
  saveFjallAccountSettings,
  saveFjallAppearanceSettings,
} from '@/lib/data-api'

const LANDING_PAGES = [
  { value: '/hlidskjalf', label: 'Hlidskjalf' },
  { value: '/dagatal', label: 'Dagatal' },
  { value: '/sogur', label: 'Sögur' },
  { value: '/audr', label: 'Audr' },
]

export function ThingAppearanceSettings() {
  const queryClient = useQueryClient()
  const statusQuery = useQuery({ queryKey: ['fjall-status'], queryFn: fetchFjallStatus, retry: false })
  const settingsQuery = useQuery({
    queryKey: ['fjall-full-settings'],
    queryFn: fetchFjallFullSettings,
    enabled: statusQuery.data?.configured === true,
  })

  const appearance = settingsQuery.data?.appearance
  const account = settingsQuery.data?.account
  const [sidebarDefault, setSidebarDefault] = useState<'EXPANDED' | 'COLLAPSED'>('EXPANDED')
  const [defaultLandingPage, setDefaultLandingPage] = useState('/hlidskjalf')
  const [dateFormat, setDateFormat] = useState<'MDY' | 'DMY' | 'YMD'>('MDY')
  const [timeFormat, setTimeFormat] = useState<'TWELVE' | 'TWENTYFOUR'>('TWELVE')
  const [publicDefaultTheme, setPublicDefaultTheme] = useState<'SYSTEM' | 'LIGHT' | 'DARK'>('SYSTEM')
  const [publicDefaultPalette, setPublicDefaultPalette] = useState<'fjall' | 'green'>('fjall')

  useEffect(() => {
    if (!appearance || !account) return
    setSidebarDefault(appearance.sidebarDefault)
    setDefaultLandingPage(appearance.defaultLandingPage === '/waypoints' ? '/hlidskjalf' : appearance.defaultLandingPage)
    setDateFormat(appearance.dateFormat)
    setTimeFormat(account.timeFormat)
    setPublicDefaultTheme(appearance.publicDefaultTheme ?? 'SYSTEM')
    setPublicDefaultPalette(appearance.publicDefaultPalette ?? 'fjall')
  }, [appearance, account])

  const saveMutation = useMutation({
    mutationFn: async () => {
      await Promise.all([
        saveFjallAppearanceSettings({
          sidebarDefault,
          defaultLandingPage,
          dateFormat,
          publicDefaultTheme,
          publicDefaultPalette,
        }),
        saveFjallAccountSettings({
          name: account?.name ?? null,
          image: account?.image ?? null,
          username: account?.username ?? null,
          customDomain: account?.customDomain ?? null,
          timeFormat,
        }),
      ])
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fjall-full-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['fjall-profile'] })
    },
  })

  if (statusQuery.isLoading) return <FormFieldsSkeleton fields={4} />
  if (!statusQuery.data?.configured) return <DataNotConfiguredNotice />
  if (settingsQuery.isLoading || !appearance || !account) return <FormFieldsSkeleton fields={4} />

  return (
    <form
      className="space-y-8"
      onSubmit={(event) => {
        event.preventDefault()
        saveMutation.mutate()
      }}
    >
      <div className="space-y-5">
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
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Public profile
        </p>
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

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

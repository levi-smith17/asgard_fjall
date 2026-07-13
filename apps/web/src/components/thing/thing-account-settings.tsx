import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { Select } from '@/components/core/ui/select'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import {
  fetchCairnFullSettings,
  fetchCairnStatus,
  saveCairnAccountSettings,
} from '@/lib/cairn-api'

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
  const [name, setName] = useState('')
  const [image, setImage] = useState('')
  const [username, setUsername] = useState('')
  const [customDomain, setCustomDomain] = useState('')
  const [timeFormat, setTimeFormat] = useState<'TWELVE' | 'TWENTYFOUR'>('TWELVE')

  useEffect(() => {
    if (!account) return
    setName(account.name ?? '')
    setImage(account.image ?? '')
    setUsername(account.username ?? '')
    setCustomDomain(account.customDomain ?? '')
    setTimeFormat(account.timeFormat)
  }, [account])

  const saveMutation = useMutation({
    mutationFn: () =>
      saveCairnAccountSettings({
        name: name.trim() || null,
        image: image.trim() || null,
        username: username.trim() || null,
        customDomain: customDomain.trim() || null,
        timeFormat,
      }),
    onSuccess: async () => {
      toast.success('Account saved')
      await queryClient.invalidateQueries({ queryKey: ['cairn-full-settings'] })
      await queryClient.invalidateQueries({ queryKey: ['cairn-profile'] })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : 'Failed to save'),
  })

  if (statusQuery.isLoading) {
    return <FormFieldsSkeleton fields={5} />
  }

  if (!statusQuery.data?.configured) {
    return <CairnNotConfiguredNotice />
  }

  if (settingsQuery.isLoading || !account) {
    return <FormFieldsSkeleton fields={5} />
  }

  return (
    <form
      className="space-y-6"
      onSubmit={(event) => {
        event.preventDefault()
        saveMutation.mutate()
      }}
    >
      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Full name</span>
        <Input value={name} onChange={(event) => setName(event.target.value)} placeholder="Your name" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Avatar URL</span>
        <Input value={image} onChange={(event) => setImage(event.target.value)} placeholder="https://…" />
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Username</span>
        <Input value={username} onChange={(event) => setUsername(event.target.value)} placeholder="username" />
        <p className="text-xs text-muted-foreground">Used for your public manifest URL.</p>
      </label>

      <label className="block space-y-1.5">
        <span className="text-sm font-medium">Custom domain</span>
        <Input
          value={customDomain}
          onChange={(event) => setCustomDomain(event.target.value)}
          placeholder="example.com"
        />
      </label>

      <ThingSettingRow
        label="Time format"
        description="How times are shown across Cairn"
        control={
          <Select
            value={timeFormat}
            onChange={(value) => setTimeFormat(value as 'TWELVE' | 'TWENTYFOUR')}
            options={[
              { value: 'TWELVE', label: '12-hour' },
              { value: 'TWENTYFOUR', label: '24-hour' },
            ]}
            className="w-32"
          />
        }
      />

      <Button type="submit" disabled={saveMutation.isPending}>
        {saveMutation.isPending ? 'Saving…' : 'Save'}
      </Button>
    </form>
  )
}

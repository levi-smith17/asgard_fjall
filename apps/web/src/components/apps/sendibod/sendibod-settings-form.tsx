import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { saveCairnSignalSettings, type CairnSignalSettings } from '@/lib/data-api'

export function SendibodSettingsForm({
  initialSettings,
  onDone,
}: {
  initialSettings: CairnSignalSettings
  onDone?: () => void
}) {
  const queryClient = useQueryClient()
  const [values, setValues] = useState<CairnSignalSettings>(initialSettings)

  useEffect(() => {
    setValues(initialSettings)
  }, [initialSettings])

  const saveMutation = useMutation({
    mutationFn: () => saveCairnSignalSettings(values),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['cairn-full-settings'] })
      onDone?.()
    },
  })

  async function handleBrowserToggle(enabled: boolean) {
    if (enabled && 'Notification' in window) {
      const perm = await Notification.requestPermission()
      if (perm !== 'granted') return
    }
    setValues((current) => ({ ...current, browserNotifications: enabled }))
  }

  return (
    <form className="space-y-8" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
      <div className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Inbox</p>
        <ThingSettingRow label="Auto-mark read" description="Mark a message as read when you open it" control={<Switch checked={values.autoMarkRead} onCheckedChange={(checked) => setValues((current) => ({ ...current, autoMarkRead: checked }))} />} />
        <ThingSettingRow label="Show snippets" description="Preview message text in the list" control={<Switch checked={values.showSnippets} onCheckedChange={(checked) => setValues((current) => ({ ...current, showSnippets: checked }))} />} />
        <ThingSettingRow label="Messages per page" description="How many threads to show per page" control={<Select value={String(values.messagesPerPage)} onChange={(value) => setValues((current) => ({ ...current, messagesPerPage: Number(value) }))} options={[10,15,25,50].map((n) => ({ value: String(n), label: String(n) }))} className="w-20" />} />
      </div>
      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notifications</p>
        <ThingSettingRow label="Browser notifications" description="Show desktop notifications for new contact-form messages" control={<Switch checked={values.browserNotifications} onCheckedChange={handleBrowserToggle} />} />
        <ThingSettingRow label="Notification sound" description="Play a sound when new messages arrive" control={<Switch checked={values.notificationSound} onCheckedChange={(checked) => setValues((current) => ({ ...current, notificationSound: checked }))} />} />
        <ThingSettingRow label="Refresh interval" description="How often to check for new messages (seconds)" control={<Select value={String(values.autoRefreshInterval)} onChange={(value) => setValues((current) => ({ ...current, autoRefreshInterval: Number(value) }))} options={[15,30,60,120].map((n) => ({ value: String(n), label: `${n}s` }))} className="w-20" />} />
      </div>
      <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
    </form>
  )
}

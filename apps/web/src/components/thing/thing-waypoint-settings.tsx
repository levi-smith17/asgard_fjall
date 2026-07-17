import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { Switch } from '@/components/core/ui/switch'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { fetchFjallFullSettings, fetchFjallStatus, saveFjallWaypointSettings } from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'

export function ThingWaypointSettings() {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const statusQuery = useQuery({ queryKey: ['fjall-status'], queryFn: fetchFjallStatus, retry: false })
  const settingsQuery = useQuery({ queryKey: ['fjall-full-settings'], queryFn: fetchFjallFullSettings, enabled: statusQuery.data?.configured === true })

  const waypoints = settingsQuery.data?.waypoints
  const [defaultSort, setDefaultSort] = useState<'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'>('NEWEST')
  const [openInNewTab, setOpenInNewTab] = useState(true)
  const [waypointsPerPage, setWaypointsPerPage] = useState(25)

  useEffect(() => {
    if (!waypoints) return
    setDefaultSort(waypoints.defaultSort)
    setOpenInNewTab(waypoints.openInNewTab)
    setWaypointsPerPage(waypoints.waypointsPerPage)
  }, [waypoints])

  const saveMutation = useMutation({
    mutationFn: () => saveFjallWaypointSettings({ defaultSort, openInNewTab, waypointsPerPage }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fjall-full-settings'] })
    },
  })

  if (statusQuery.isLoading) return <FormFieldsSkeleton fields={3} />
  if (!statusQuery.data?.configured) return <DataNotConfiguredNotice />
  if (settingsQuery.isLoading || !waypoints) return <FormFieldsSkeleton fields={3} />

  return (
    <form className="space-y-8" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
      <div className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display</p>
        <ThingSettingRow
          label={`${terms.laufar} per page`}
          description={`How many ${terms.laufar.toLowerCase()} to show in the list at once`}
          control={<Select value={String(waypointsPerPage)} onChange={(value) => setWaypointsPerPage(Number(value))} options={[10,25,50,100].map((n) => ({ value: String(n), label: String(n) }))} className="w-20" />}
        />
        <ThingSettingRow
          label="Default sort order"
          description={`How ${terms.laufar.toLowerCase()} are ordered when no sort is applied`}
          control={<Select value={defaultSort} onChange={(value) => setDefaultSort(value as typeof defaultSort)} options={[{ value: 'NEWEST', label: 'Newest first' },{ value: 'OLDEST', label: 'Oldest first' },{ value: 'TITLE_ASC', label: 'Title A-Z' },{ value: 'TITLE_DESC', label: 'Title Z-A' }]} className="w-36" />}
        />
      </div>
      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Behavior</p>
        <ThingSettingRow
          label="Open links in new tab"
          description={`Open ${terms.laufarSingular.toLowerCase()} URLs in a new browser tab instead of the current one`}
          control={<Switch checked={openInNewTab} onCheckedChange={setOpenInNewTab} />}
        />
      </div>
      <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
    </form>
  )
}

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FormFieldsSkeleton } from '@/components/core/ui/studio-skeletons'
import { Button } from '@/components/core/ui/button'
import { Select } from '@/components/core/ui/select'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { ThingSettingRow } from '@/components/thing/thing-setting-row'
import { fetchFjallFullSettings, fetchFjallStatus, saveFjallLogSettings } from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'

export function ThingLogSettings() {
  const terms = useTerms()
  const queryClient = useQueryClient()
  const statusQuery = useQuery({ queryKey: ['fjall-status'], queryFn: fetchFjallStatus, retry: false })
  const settingsQuery = useQuery({
    queryKey: ['fjall-full-settings'],
    queryFn: fetchFjallFullSettings,
    enabled: statusQuery.data?.configured === true,
  })

  const logs = settingsQuery.data?.logs
  const [logsPerPage, setLogsPerPage] = useState(25)
  const [defaultSort, setDefaultSort] = useState<'NEWEST' | 'OLDEST'>('NEWEST')

  useEffect(() => {
    if (!logs) return
    setLogsPerPage(logs.logsPerPage)
    setDefaultSort(logs.defaultSort)
  }, [logs])

  const saveMutation = useMutation({
    mutationFn: () => saveFjallLogSettings({ logsPerPage, defaultSort }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['fjall-full-settings'] })
    },
  })

  if (statusQuery.isLoading) return <FormFieldsSkeleton fields={2} />
  if (!statusQuery.data?.configured) return <DataNotConfiguredNotice />
  if (settingsQuery.isLoading || !logs) return <FormFieldsSkeleton fields={2} />

  return (
    <form className="space-y-8" onSubmit={(event) => { event.preventDefault(); saveMutation.mutate() }}>
      <div className="space-y-5">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Display</p>
        <ThingSettingRow
          label={`${terms.notes} per page`}
          description={`How many ${terms.notes.toLowerCase()} to show in the list at once`}
          control={<Select value={String(logsPerPage)} onChange={(value) => setLogsPerPage(Number(value))} options={[10,25,50,100].map((n) => ({ value: String(n), label: String(n) }))} className="w-20" />}
        />
      </div>
      <div className="space-y-5 border-t border-border pt-8">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Behavior</p>
        <ThingSettingRow
          label="Default sort order"
          description={`How ${terms.notes.toLowerCase()} are ordered when no sort is applied`}
          control={<Select value={defaultSort} onChange={(value) => setDefaultSort(value as typeof defaultSort)} options={[{ value: 'NEWEST', label: 'Newest first' }, { value: 'OLDEST', label: 'Oldest first' }]} className="w-36" />}
        />
      </div>
      <Button type="submit" disabled={saveMutation.isPending}>{saveMutation.isPending ? 'Saving…' : 'Save'}</Button>
    </form>
  )
}

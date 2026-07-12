import { useCallback, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { DagatalClient } from '@/components/cairn/dagatal/dagatal-client'
import { DagatalContextBar } from '@/components/cairn/dagatal/dagatal-context-bar'
import { CalendarSkeleton } from '@/components/core/ui/studio-skeletons'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { fetchDagatalCalendars, syncDagatal } from '@/lib/dagatal-api'

export function DagatalPage() {
  const queryClient = useQueryClient()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [eventsMeta, setEventsMeta] = useState({ count: 0, loading: false, error: null as string | null })

  const calendarsQuery = useQuery({
    queryKey: ['dagatal-calendars'],
    queryFn: fetchDagatalCalendars,
    retry: false,
  })

  const shellLoading = calendarsQuery.isLoading

  const reloadEvents = useCallback(() => {
    void (async () => {
      try {
        await syncDagatal()
        toast.success('Calendars synced')
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Sync failed')
      }
      await queryClient.invalidateQueries({ queryKey: ['dagatal-events'] })
    })()
  }, [queryClient])

  const inspectorOpen = inspectorPinned
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  return (
    <StudioLayout
      contextBar={
        <DagatalContextBar
          eventCount={!shellLoading ? eventsMeta.count : undefined}
          eventsLoading={!shellLoading ? eventsMeta.loading : undefined}
          eventsError={!shellLoading ? eventsMeta.error : undefined}
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
        />
      }
      canvas={
        shellLoading ? (
          <CalendarSkeleton />
        ) : (
          <DagatalClient
            stops={[]}
            calendars={calendarsQuery.data ?? []}
            onEventsMetaChange={setEventsMeta}
            onReload={reloadEvents}
          />
        )
      }
      inspectorState={!shellLoading ? inspectorState : 'hidden'}
      inspectorHint="Select an event"
      inspector={
        inspectorPinned ? (
          <div className="flex h-full flex-col">
            <div className="border-b border-border px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector</p>
            </div>
            <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">Select an event on the calendar to view details.</p>
          </div>
        ) : null
      }
    />
  )
}

import { useCallback, useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { InspectorEmptyState } from '@/components/core/ui/inspector-chrome'
import { DagatalClient } from '@/components/apps/dagatal/dagatal-client'
import { DagatalContextBar } from '@/components/apps/dagatal/dagatal-context-bar'
import { DagatalEventInspector } from '@/components/apps/dagatal/dagatal-event-inspector'
import type { DagatalEventSelection } from '@/components/apps/dagatal/dagatal-types'
import { CalendarSkeleton } from '@/components/core/ui/studio-skeletons'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { fetchDagatalCalendars, syncDagatal } from '@/lib/dagatal-api'

export function DagatalPage() {
  const queryClient = useQueryClient()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [selectedEvent, setSelectedEvent] = useState<DagatalEventSelection | null>(null)
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

  const dismissInspector = useCallback(() => {
    if (inspectorPinned || selectedEvent == null) return
    setSelectedEvent(null)
  }, [inspectorPinned, selectedEvent])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  const inspectorOpen = inspectorPinned || selectedEvent != null
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
            selectedEventId={selectedEvent?.id ?? null}
            onSelectEvent={setSelectedEvent}
            onClearEvent={dismissInspector}
          />
        )
      }
      inspectorState={!shellLoading ? inspectorState : 'hidden'}
      inspectorHint="Select an event"
      onDismissInspector={dismissInspector}
      inspector={
        selectedEvent ? (
          <DagatalEventInspector event={selectedEvent} />
        ) : inspectorPinned ? (
          <InspectorEmptyState message="Select an event on the calendar to view details." />
        ) : null
      }
    />
  )
}

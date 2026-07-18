import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { luviNavLabel, type CalendarMode } from '@/lib/luvi'
import { fetchDagatalEvents } from '@/lib/dagatal-api'
import { dagatalEventRange } from '@/lib/dagatal-range'
import { filterDagatalEventsToRange } from '@/lib/dagatal-events'
import { cn } from '@/lib/utils'
import { MonthView } from './month-view'
import { WeekView } from './week-view'
import { DayView } from './day-view'
import { DagatalToolbar } from './dagatal-toolbar'
import type { CalendarOption, StopWithRunir } from './dagatal-types'

type CalendarView = 'month' | 'week' | 'day'

interface DagatalClientProps {
  stops: StopWithRunir[]
  calendars: CalendarOption[]
  onEventsMetaChange?: (meta: { count: number; loading: boolean; error: string | null }) => void
  onReload: () => void
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

function navigateCalendar(view: CalendarView, anchor: Date, dir: -1 | 1, mode: CalendarMode): Date {
  if (mode === 'luvi-full') {
    if (view === 'month') return addDays(anchor, dir * 26)
    if (view === 'week') return addDays(anchor, dir * 13)
    return addDays(anchor, dir)
  }
  if (view === 'month') {
    const d = new Date(anchor)
    d.setMonth(d.getMonth() + dir)
    return d
  }
  if (view === 'week') return addDays(anchor, dir * 7)
  return addDays(anchor, dir)
}

function navLabel(view: CalendarView, anchor: Date, mode: CalendarMode): string {
  if (mode === 'luvi-full') return luviNavLabel(view, anchor)
  if (view === 'month')
    return anchor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
  if (view === 'week') {
    const s = new Date(anchor)
    s.setDate(anchor.getDate() - anchor.getDay())
    const e = new Date(s)
    e.setDate(s.getDate() + 6)
    return `${s.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – ${e.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`
  }
  return anchor.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
}

export function DagatalClient({ stops, calendars, onEventsMetaChange, onReload }: DagatalClientProps) {
  const [view, setView] = useState<CalendarView>('month')
  const [anchor, setAnchor] = useState(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return now
  })
  const [calendarMode, setCalendarMode] = useState<CalendarMode>('gregorian')
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<string[]>([])

  useEffect(() => {
    if (calendars.length === 0) return
    setSelectedCalendarIds((current) => {
      if (current.length === 0) return calendars.map((calendar) => calendar.id)
      const valid = new Set(calendars.map((calendar) => calendar.id))
      const next = current.filter((id) => valid.has(id))
      return next.length > 0 ? next : calendars.map((calendar) => calendar.id)
    })
  }, [calendars])

  const eventRange = useMemo(() => dagatalEventRange(view, anchor), [view, anchor])

  const eventsQuery = useQuery({
    queryKey: ['dagatal-events'],
    queryFn: () => fetchDagatalEvents(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  })

  const allEvents = eventsQuery.data?.events ?? []
  const filteredEvents = useMemo(() => {
    if (calendars.length === 0 || selectedCalendarIds.length === 0) return []
    if (selectedCalendarIds.length === calendars.length) return allEvents
    const allowed = new Set(selectedCalendarIds)
    return allEvents.filter((event) => allowed.has(event.calendarId))
  }, [allEvents, calendars.length, selectedCalendarIds])
  const filteredStops = useMemo(() => {
    if (calendars.length === 0 || selectedCalendarIds.length === 0) {
      return stops.filter((stop) => !stop.icloudCalendarId)
    }
    if (selectedCalendarIds.length === calendars.length) return stops
    const allowed = new Set(selectedCalendarIds)
    return stops.filter(
      (stop) => !stop.icloudCalendarId || allowed.has(stop.icloudCalendarId),
    )
  }, [stops, calendars.length, selectedCalendarIds])
  const calendarSync = eventsQuery.data?.calendarSync ?? []
  const cacheStatus = eventsQuery.data?.cacheStatus
  const syncIssues = calendarSync.filter((entry) => entry.status !== 'ok')
  const eventsInRange = useMemo(
    () => filterDagatalEventsToRange(filteredEvents, eventRange.from, eventRange.to),
    [filteredEvents, eventRange.from, eventRange.to],
  )
  const eventsLoading = eventsQuery.isLoading || eventsQuery.isFetching
  const eventsError =
    eventsQuery.isError && allEvents.length === 0
      ? eventsQuery.error instanceof Error
        ? eventsQuery.error.message
        : 'Failed to load calendar events'
      : null

  useEffect(() => {
    onEventsMetaChange?.({
      count: eventsInRange.length,
      loading: eventsLoading,
      error: eventsError,
    })
  }, [eventsInRange.length, eventsLoading, eventsError, onEventsMetaChange])

  function goToday() {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    setAnchor(now)
  }

  const calendarColorMap = Object.fromEntries(calendars.map((c) => [c.id, c.color]))
  const viewProps = {
    stops: filteredStops,
    icloudEvents: filteredEvents,
    anchor,
    calendarMode,
    calendarColorMap,
  }
  const selectedCalendars = calendars.filter((calendar) => selectedCalendarIds.includes(calendar.id))
  const calendarNames = selectedCalendars.map((calendar) => calendar.name).join(', ')
  const selectedSources = new Set(selectedCalendars.map((calendar) => calendar.source))
  const onlySubscriptions =
    selectedSources.size > 0 && [...selectedSources].every((source) => source === 'subscription')
  const onlyIcloud =
    selectedSources.size > 0 && [...selectedSources].every((source) => source === 'icloud')

  function toggleCalendar(id: string) {
    setSelectedCalendarIds((current) => {
      if (current.includes(id)) {
        if (current.length === 1) return current
        return current.filter((calendarId) => calendarId !== id)
      }
      return [...current, id]
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <DagatalToolbar
        view={view}
        onViewChange={setView}
        periodLabel={navLabel(view, anchor, calendarMode)}
        calendarMode={calendarMode}
        onCalendarModeChange={setCalendarMode}
        calendarOptions={calendars.map((calendar) => ({ id: calendar.id, label: calendar.name }))}
        selectedCalendarIds={selectedCalendarIds}
        onToggleCalendar={toggleCalendar}
        onPrev={() => setAnchor((d) => navigateCalendar(view, d, -1, calendarMode))}
        onNext={() => setAnchor((d) => navigateCalendar(view, d, 1, calendarMode))}
        onToday={goToday}
        eventsLoading={eventsLoading}
        onReload={onReload}
      />
      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-auto',
          eventsLoading && allEvents.length === 0 && 'opacity-60',
        )}
      >
        {eventsError ? (
          <div className="border-b border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive sm:px-6">
            {eventsError}. Check Thing → Dagatal settings and reload.
          </div>
        ) : null}
        {!eventsError && cacheStatus === 'stale' && allEvents.length > 0 ? (
          <div className="border-b border-warning/40 bg-warning-muted/40 px-4 py-2 text-sm text-foreground sm:px-6">
            Showing cached calendar events — sync may have failed. Use reload to retry, or check
            Thing → Dagatal.
          </div>
        ) : null}
        {!eventsError && !eventsLoading && syncIssues.length > 0 ? (
          <div className="space-y-1 border-b border-warning/40 bg-warning-muted/40 px-4 py-2 text-sm text-foreground sm:px-6">
            {syncIssues.map((issue) => (
              <p key={issue.calendarId}>
                {issue.message ??
                  (issue.source === 'subscription'
                    ? `Could not sync subscription "${issue.name}". Check the feed URL in Thing → Dagatal.`
                    : `Could not sync iCloud calendar "${issue.name}". Check Thing → Dagatal.`)}
              </p>
            ))}
          </div>
        ) : null}
        {!eventsError &&
        !eventsLoading &&
        syncIssues.length === 0 &&
        calendars.length > 0 &&
        selectedCalendarIds.length > 0 &&
        filteredEvents.length === 0 ? (
          <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground sm:px-6">
            {onlySubscriptions
              ? `No events found for ${calendarNames || 'selected subscriptions'} in the synced range. Use reload to retry, or check the feed URL in Thing → Dagatal.`
              : onlyIcloud
                ? `No iCloud events returned for ${calendarNames || 'configured calendars'}. Each calendar name must match its iCloud display name exactly in Thing → Dagatal.`
                : `No events found for ${calendarNames || 'selected calendars'}. Use reload to retry, or check Thing → Dagatal.`}
          </div>
        ) : null}
        {!eventsError &&
        !eventsLoading &&
        filteredEvents.length > 0 &&
        eventsInRange.length === 0 ? (
          <div className="border-b border-border bg-muted/30 px-4 py-2 text-sm text-muted-foreground sm:px-6">
            No events in this date range. Navigate to another month or week to see synced events.
          </div>
        ) : null}
        {view === 'month' ? <MonthView {...viewProps} /> : null}
        {view === 'week' ? <WeekView {...viewProps} /> : null}
        {view === 'day' ? <DayView {...viewProps} /> : null}
      </div>
    </div>
  )
}

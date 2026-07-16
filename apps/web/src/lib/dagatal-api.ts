import { cairnFetch } from '@/lib/data-client'
import type { CairnExternalCalendarEvent } from '@/lib/data-types'
import type { CairnCalendarSyncStatus } from '@/lib/data-api'
import { parseCairnItineraryEventsPayload, reviveItineraryEvents } from '@/lib/dagatal-events'

export type DagatalEventsResult = {
  events: CairnExternalCalendarEvent[]
  calendarSync: CairnCalendarSyncStatus[]
  cacheStatus: string | null
}

export type DagatalCalendar = {
  id: string
  name: string
  color: string
  source: 'icloud' | 'subscription'
}

export async function fetchDagatalCalendars(): Promise<DagatalCalendar[]> {
  const settings = await cairnFetch<{
    calendars?: { id: string; name: string; color: string }[]
    calendarSubscriptions?: { id: string; name: string; color: string }[]
  }>('/settings')

  const calendars = (settings.calendars ?? []).map((c) => ({ ...c, source: 'icloud' as const }))
  const subscriptions = (settings.calendarSubscriptions ?? []).map((s) => ({ ...s, source: 'subscription' as const }))
  return [...calendars, ...subscriptions]
}

export async function fetchDagatalEvents(params?: {
  from?: string
  to?: string
  refresh?: boolean
}): Promise<DagatalEventsResult> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  if (params?.refresh) qs.set('refresh', 'true')
  const query = qs.toString()

  const data = await cairnFetch<{
    events?: Record<string, unknown>[]
    calendarSync?: CairnCalendarSyncStatus[]
  }>(`/itinerary/events${query ? `?${query}` : ''}`)

  return {
    events: reviveItineraryEvents(parseCairnItineraryEventsPayload(data)),
    calendarSync: Array.isArray(data.calendarSync) ? data.calendarSync : [],
    cacheStatus: null,
  }
}

export async function syncDagatal(): Promise<void> {
  await cairnFetch('/itinerary/sync', { method: 'POST', body: '{}' })
}

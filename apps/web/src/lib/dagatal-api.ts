import { fjallFetch } from '@/lib/data-client'
import type { FjallExternalCalendarEvent } from '@/lib/data-types'
import type { FjallCalendarSyncStatus } from '@/lib/data-api'
import { parseFjallItineraryEventsPayload, reviveItineraryEvents } from '@/lib/dagatal-events'

export type DagatalEventsResult = {
  events: FjallExternalCalendarEvent[]
  calendarSync: FjallCalendarSyncStatus[]
  cacheStatus: string | null
}

export type DagatalCalendar = {
  id: string
  name: string
  color: string
  source: 'icloud' | 'subscription'
}

export async function fetchDagatalCalendars(): Promise<DagatalCalendar[]> {
  const settings = await fjallFetch<{
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

  const data = await fjallFetch<{
    events?: Record<string, unknown>[]
    calendarSync?: FjallCalendarSyncStatus[]
  }>(`/itinerary/events${query ? `?${query}` : ''}`)

  return {
    events: reviveItineraryEvents(parseFjallItineraryEventsPayload(data)),
    calendarSync: Array.isArray(data.calendarSync) ? data.calendarSync : [],
    cacheStatus: null,
  }
}

export async function syncDagatal(): Promise<void> {
  await fjallFetch('/itinerary/sync', { method: 'POST', body: '{}' })
}

import type { FjallExternalCalendarEvent } from '@/lib/data-types'
import type { ICloudEventDisplay } from '@/components/apps/dagatal/dagatal-types'

function localDateKey(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function floatingDateKey(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function eventOccursOnDay(event: ICloudEventDisplay, date: Date): boolean {
  const start = new Date(event.startDate)
  const end = event.endDate ? new Date(event.endDate) : start

  if (event.allDay) {
    const dayKey = localDateKey(date)
    const startKey = floatingDateKey(start)
    const endKey = floatingDateKey(end)
    return dayKey >= startKey && dayKey <= endKey
  }

  const dayStart = new Date(date)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(date)
  dayEnd.setHours(23, 59, 59, 999)
  return start <= dayEnd && end >= dayStart
}

export function reviveDagatalEvents(events: FjallExternalCalendarEvent[]): FjallExternalCalendarEvent[] {
  return events.map((event) => ({
    ...event,
    startDate: new Date(event.startDate),
    endDate: event.endDate ? new Date(event.endDate) : null,
  }))
}

export function filterDagatalEventsToRange(
  events: FjallExternalCalendarEvent[],
  from: string,
  to: string,
): FjallExternalCalendarEvent[] {
  const rangeStart = new Date(from)
  const rangeEnd = new Date(to)
  if (Number.isNaN(rangeStart.getTime()) || Number.isNaN(rangeEnd.getTime())) return events
  return events.filter((event) => {
    const start = new Date(event.startDate)
    const end = event.endDate ? new Date(event.endDate) : start
    return start <= rangeEnd && end >= rangeStart
  })
}

export function icloudEventsForDay(events: ICloudEventDisplay[], date: Date): ICloudEventDisplay[] {
  return events.filter((event) => eventOccursOnDay(event, date))
}

export function mapFjallDagatalEvent(raw: Record<string, unknown>): FjallExternalCalendarEvent | null {
  const startRaw = raw.startDate ?? raw.start_date ?? raw.start
  if (startRaw == null || startRaw === '') return null
  const endRaw = raw.endDate ?? raw.end_date ?? raw.end
  const startDate = new Date(startRaw as string | number)
  if (Number.isNaN(startDate.getTime())) return null
  const endDate = endRaw != null && endRaw !== '' ? new Date(endRaw as string | number) : null
  if (endDate != null && Number.isNaN(endDate.getTime())) return null
  return {
    uid: String(raw.uid ?? raw.id ?? startDate.toISOString()),
    title: String(raw.title ?? raw.summary ?? 'Untitled'),
    startDate,
    endDate,
    allDay: Boolean(raw.allDay ?? raw.all_day ?? false),
    location: (raw.location as string | null) ?? null,
    notes: (raw.notes as string | null) ?? (raw.description as string | null) ?? null,
    color: String(raw.color ?? '#6366f1'),
    readonly: Boolean(raw.readonly ?? true),
    calendarId: String(raw.calendarId ?? raw.calendar_id ?? ''),
    url: String(raw.url ?? ''),
    recurrenceRule: (raw.recurrenceRule as string | null) ?? (raw.recurrence_rule as string | null) ?? null,
  }
}

export function parseFjallDagatalEventsPayload(data: unknown): FjallExternalCalendarEvent[] {
  const records = extractDagatalEventRecords(data)
  const events: FjallExternalCalendarEvent[] = []
  for (const record of records) {
    const mapped = mapFjallDagatalEvent(record)
    if (mapped) events.push(mapped)
  }
  return events
}

function extractDagatalEventRecords(data: unknown): Record<string, unknown>[] {
  if (Array.isArray(data)) {
    return data.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
  }
  if (!data || typeof data !== 'object') return []
  const payload = data as Record<string, unknown>
  const nested = payload.events
  if (Array.isArray(nested)) return nested.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
  const dataField = payload.data
  if (Array.isArray(dataField)) return dataField.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
  if (dataField && typeof dataField === 'object') {
    const inner = dataField as Record<string, unknown>
    if (Array.isArray(inner.events)) return inner.events.filter((item): item is Record<string, unknown> => item != null && typeof item === 'object')
  }
  return []
}

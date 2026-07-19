export type StopWithRunir = {
  id: string
  title: string
  notes: string | null
  location: string | null
  startDate: Date
  endDate: Date | null
  allDay: boolean
  icloudCalendarId: string | null
  runir: {
    runId: string
    run: { id: string; name: string; color: string; icon: string | null }
  }[]
}

export type CalendarOption = {
  id: string
  name: string
  color: string
  source: 'icloud' | 'subscription'
}

export type ICloudEventDisplay = {
  uid: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  location: string | null
  notes: string | null
  color: string
  readonly: boolean
  calendarId: string
  url: string
  recurrenceRule: string | null
}

/** Normalized calendar event shown in the Dagatal inspector. */
export type DagatalEventSelection = {
  id: string
  title: string
  startDate: Date
  endDate: Date | null
  allDay: boolean
  location: string | null
  notes: string | null
  color: string
}

export function selectionFromStop(
  stop: StopWithRunir,
  calendarColorMap: Record<string, string>,
): DagatalEventSelection {
  const color =
    stop.runir[0]?.run.color ??
    (stop.icloudCalendarId ? calendarColorMap[stop.icloudCalendarId] : undefined) ??
    '#6b7280'
  return {
    id: `stop:${stop.id}`,
    title: stop.title,
    startDate: stop.startDate instanceof Date ? stop.startDate : new Date(stop.startDate),
    endDate: stop.endDate
      ? stop.endDate instanceof Date
        ? stop.endDate
        : new Date(stop.endDate)
      : null,
    allDay: stop.allDay,
    location: stop.location,
    notes: stop.notes,
    color,
  }
}

export function selectionFromICloud(event: ICloudEventDisplay): DagatalEventSelection {
  return {
    id: `icloud:${event.uid}`,
    title: event.title,
    startDate: event.startDate instanceof Date ? event.startDate : new Date(event.startDate),
    endDate: event.endDate
      ? event.endDate instanceof Date
        ? event.endDate
        : new Date(event.endDate)
      : null,
    allDay: event.allDay,
    location: event.location,
    notes: event.notes,
    color: event.color,
  }
}

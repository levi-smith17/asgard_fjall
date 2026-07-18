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

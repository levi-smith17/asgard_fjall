/** Fjall data API types — inlined from legacy Summit shapes. */

export type FjallApiResponse<T> = { data: T }

export type FjallStatusResponse = {
  configured: boolean
  baseUrl: string
}

export type FjallEmbeddedMarker = {
  id: string
  name: string
  color: string
  icon?: string
}

export type FjallWaypoint = {
  pk: string
  sk: string
  url: string
  title: string
  description?: string
  favicon?: string
  notes?: string
  read: boolean
  readLater: boolean
  trailId?: string
  markers: FjallEmbeddedMarker[]
  createdAt: string
}

export type FjallTrail = {
  pk: string
  sk: string
  name: string
  createdAt: string
}

export type FjallMarker = {
  pk: string
  sk: string
  name: string
  color: string
  icon?: string | null
  createdAt: string
  waypointCount?: number
}

export type FjallWaypointView = {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  notes: string
  read: boolean
  readLater: boolean
  trailId: string | null
  trailName: string | null
  markers: FjallEmbeddedMarker[]
  createdAt: string
}

export type FjallTrailView = {
  id: string
  name: string
  createdAt: string
}

export type FjallMarkerView = {
  id: string
  name: string
  color: string
  icon: string | null
  createdAt: string
  waypointCount: number
}

export type FjallWaypointMeta = {
  title: string | null
  favicon: string | null
}

export type SaveFjallWaypointRequest = {
  title: string
  url: string
  description?: string
  notes?: string
  favicon?: string
  trailId?: string | null
  markerIds?: string[]
  read?: boolean
  readLater?: boolean
}

export type SaveFjallTrailRequest = { name: string }

export type SaveFjallMarkerRequest = {
  name: string
  color: string
  icon?: string | null
}

// — Audr —

export type FjallMarkerJunction = {
  markerId: string
  marker: FjallEmbeddedMarker
}

export type FjallBurn = {
  id: string
  name: string
  amount: number
  date: string
  notes?: string | null
  receiptUrl?: string | null
  fundId?: string | null
  markers: FjallMarkerJunction[]
}

export type FjallSupplyline = {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  url?: string | null
  notes?: string | null
  active: boolean
  fundId?: string | null
  markers: FjallMarkerJunction[]
}

export type FjallCacheUtilization = {
  id: string
  markerId: string
  marker: FjallEmbeddedMarker
  limit: number
  spent: number
  utilization: number
  fundId?: string | null
}

export type FjallSjodr = {
  pk: string
  sk: string
  name: string
  description?: string | null
  color?: string | null
  createdAt: string
}

export type FjallSjodrView = {
  id: string
  name: string
  description: string | null
  color: string | null
  createdAt: string
}

export type SaveFjallSjodrRequest = {
  name: string
  description?: string | null
  color?: string | null
}

export type FjallUpcomingRenewal = {
  id: string
  name: string
  amount: number
  nextRenewal: string
  billingCycle: string
}

export type AudrSummary = {
  summary: {
    monthlySupplylineCost: number
    totalBurn: number
    totalMonthSpend: number
    activeSupplylines: number
  }
  upcomingRenewals: FjallUpcomingRenewal[]
  cacheUtilization: FjallCacheUtilization[]
}

export type FjallBurnPage = {
  burn: FjallBurn[]
  total: number
  pageSize: number
}

// — Dagatal —

export type FjallCalendarOption = {
  id: string
  name: string
  color: string
}

export type FjallExternalCalendarEvent = {
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

export type FjallSettings = {
  calendars?: { id: string; name: string; color: string }[]
  calendarSubscriptions?: { id: string; name: string; color: string }[]
}

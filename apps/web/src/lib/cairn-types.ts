/** Cairn API types — inlined from @asgard/types cairn.ts */

export type CairnApiResponse<T> = { data: T }

export type CairnStatusResponse = {
  configured: boolean
  baseUrl: string
}

export type CairnEmbeddedMarker = {
  id: string
  name: string
  color: string
  icon?: string
}

export type CairnWaypoint = {
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
  markers: CairnEmbeddedMarker[]
  createdAt: string
}

export type CairnTrail = {
  pk: string
  sk: string
  name: string
  createdAt: string
}

export type CairnMarker = {
  pk: string
  sk: string
  name: string
  color: string
  icon?: string | null
  createdAt: string
  waypointCount?: number
}

export type CairnWaypointView = {
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
  markers: CairnEmbeddedMarker[]
  createdAt: string
}

export type CairnTrailView = {
  id: string
  name: string
  createdAt: string
}

export type CairnMarkerView = {
  id: string
  name: string
  color: string
  icon: string | null
  createdAt: string
  waypointCount: number
}

export type CairnWaypointMeta = {
  title: string | null
  favicon: string | null
}

export type SaveCairnWaypointRequest = {
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

export type SaveCairnTrailRequest = { name: string }

export type SaveCairnMarkerRequest = {
  name: string
  color: string
  icon?: string | null
}

// — Audr —

export type CairnMarkerJunction = {
  markerId: string
  marker: CairnEmbeddedMarker
}

export type CairnBurn = {
  id: string
  name: string
  amount: number
  date: string
  notes?: string | null
  receiptUrl?: string | null
  markers: CairnMarkerJunction[]
}

export type CairnSupplyline = {
  id: string
  name: string
  amount: number
  billingCycle: string
  nextRenewal: string
  url?: string | null
  notes?: string | null
  active: boolean
  markers: CairnMarkerJunction[]
}

export type CairnCacheUtilization = {
  id: string
  markerId: string
  marker: CairnEmbeddedMarker
  limit: number
  spent: number
  utilization: number
}

export type CairnUpcomingRenewal = {
  id: string
  name: string
  amount: number
  nextRenewal: string
  billingCycle: string
}

export type CairnProvisionsSummary = {
  summary: {
    monthlySupplylineCost: number
    totalBurn: number
    totalMonthSpend: number
    activeSupplylines: number
  }
  upcomingRenewals: CairnUpcomingRenewal[]
  cacheUtilization: CairnCacheUtilization[]
}

export type CairnBurnPage = {
  burn: CairnBurn[]
  total: number
  pageSize: number
}

// — Dagatal —

export type CairnCalendarOption = {
  id: string
  name: string
  color: string
}

export type CairnExternalCalendarEvent = {
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

export type CairnSettings = {
  calendars?: { id: string; name: string; color: string }[]
  calendarSubscriptions?: { id: string; name: string; color: string }[]
}

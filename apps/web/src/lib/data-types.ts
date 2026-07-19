/** Fjall data API types — inlined from legacy Summit shapes. */

export type FjallApiResponse<T> = { data: T }

export type FjallStatusResponse = {
  configured: boolean
  baseUrl: string
}

export type FjallEmbeddedRun = {
  id: string
  name: string
  color: string
  icon?: string
}

export type FjallLauf = {
  pk: string
  sk: string
  url: string
  title: string
  description?: string
  favicon?: string
  notes?: string
  read: boolean
  readLater: boolean
  greinId?: string
  /** Legacy attribute name; prefer `greinId`. */
  trailId?: string
  runir?: FjallEmbeddedRun[]
  /** Legacy attribute name; prefer `runir`. */
  markers?: FjallEmbeddedRun[]
  createdAt: string
}

export type FjallGrein = {
  pk: string
  sk: string
  name: string
  hiddenPages?: string[]
  createdAt: string
}

export type FjallRun = {
  pk: string
  sk: string
  name: string
  color: string
  icon?: string | null
  createdAt: string
  laufCount?: number
}

export type FjallLaufView = {
  id: string
  url: string
  title: string
  description: string
  favicon: string
  notes: string
  read: boolean
  readLater: boolean
  greinId: string | null
  greinName: string | null
  runir: FjallEmbeddedRun[]
  createdAt: string
}

export type FjallGreinView = {
  id: string
  name: string
  /** Pages the Grein is explicitly hidden from. `null` means unset (legacy default applies). */
  hiddenPages: string[] | null
  createdAt: string
}

export type FjallRunView = {
  id: string
  name: string
  color: string
  icon: string | null
  createdAt: string
  laufCount: number
}

export type FjallLaufMeta = {
  title: string | null
  favicon: string | null
}

export type SaveFjallLaufRequest = {
  title: string
  url: string
  description?: string
  notes?: string
  favicon?: string
  greinId?: string | null
  runIds?: string[]
  read?: boolean
  readLater?: boolean
}

export type SaveFjallGreinRequest = { name: string; hiddenPages?: string[] }

export type SaveFjallRunRequest = {
  name: string
  color: string
  icon?: string | null
}

// — Audr —

export type FjallRunJunction = {
  runId: string
  run: FjallEmbeddedRun
}

export type FjallBurn = {
  id: string
  name: string
  amount: number
  date: string
  notes?: string | null
  receiptUrl?: string | null
  fundId?: string | null
  runir: FjallRunJunction[]
  /** Legacy attribute name; prefer `runir`. */
  markers?: FjallRunJunction[] | FjallEmbeddedRun[]
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
  runir: FjallRunJunction[]
  /** Legacy attribute name; prefer `runir`. */
  markers?: FjallRunJunction[] | FjallEmbeddedRun[]
}

export type FjallCacheUtilization = {
  id: string
  runId: string
  run: FjallEmbeddedRun
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

import { cairnFetch, fetchCairnHealth } from '@/lib/cairn-client'
import { CAIRN_API_URL } from '@/lib/config'
import { isCognitoConfigured } from '@/lib/cognito'
import type {
  CairnBurnPage,
  CairnCalendarOption,
  CairnExternalCalendarEvent,
  CairnMarker,
  CairnMarkerView,
  CairnProvisionsSummary,
  CairnSjodr,
  CairnSjodrView,
  CairnSupplyline,
  CairnTrail,
  CairnTrailView,
  CairnWaypoint,
  CairnWaypointMeta,
  SaveCairnSjodrRequest,
  SaveCairnWaypointRequest,
} from '@/lib/cairn-types'
import { extractCairnId } from '@/lib/cairn-format'
import { parseCairnItineraryEventsPayload, reviveItineraryEvents } from '@/lib/dagatal-events'

// ─── Status ────────────────────────────────────────────────────────────────

export type CairnStatusResponse = {
  configured: boolean
  baseUrl: string
}

/**
 * Fjall talks to Cairn directly (no Asgard BFF token).
 * Treat Cognito + reachable API as "configured" — api.cairn.ing has no `/status`.
 */
export async function fetchCairnStatus(): Promise<CairnStatusResponse> {
  const health = await fetchCairnHealth()
  return {
    configured: isCognitoConfigured() && health.ok,
    baseUrl: CAIRN_API_URL,
  }
}

// ─── Settings ──────────────────────────────────────────────────────────────

export type CairnSignalSettings = {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  compactView: boolean
  showSnippets: boolean
  browserNotifications: boolean
  notificationSound: boolean
}

export type CairnCalendarEntry = {
  id: string
  name: string
  color: string
  appleId?: string
}

export type CairnSubscriptionEntry = {
  id: string
  name: string
  url: string
  color: string
}

export type CairnFullSettings = {
  account: {
    name: string | null
    image: string | null
    username: string | null
    timeFormat: 'TWELVE' | 'TWENTYFOUR'
    listed: boolean
    defaultTerminology: 'CAIRN' | 'STANDARD'
    defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
    customDomain: string | null
  }
  privacy: {
    manifestVisibility: 'PUBLIC' | 'UNLISTED' | 'PRIVATE'
    contactFormEnabled: boolean
  }
  itinerary: {
    defaultView: 'MONTH' | 'WEEK' | 'DAY'
    firstDayOfWeek: 'SUNDAY' | 'MONDAY'
    defaultEventDuration: number
    showWeekNumbers: boolean
  }
  calendars: CairnCalendarEntry[]
  calendarSubscriptions: CairnSubscriptionEntry[]
  signals: CairnSignalSettings
}

export async function fetchCairnFullSettings(): Promise<CairnFullSettings> {
  return cairnFetch<CairnFullSettings>('/settings')
}

export type CairnProfile = {
  username: string | null
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
}

export async function fetchCairnProfile(): Promise<CairnProfile> {
  return cairnFetch<CairnProfile>('/profile')
}

export async function saveCairnAccountSettings(data: Record<string, unknown>): Promise<void> {
  await cairnFetch('/settings/account', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveCairnPrivacySettings(data: Record<string, unknown>): Promise<void> {
  await cairnFetch('/settings/privacy', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveCairnListedSetting(listed: boolean): Promise<void> {
  await cairnFetch('/settings/account', {
    method: 'PUT',
    body: JSON.stringify({ listed }),
  })
}

export async function saveCairnItinerarySettings(data: Record<string, unknown>): Promise<void> {
  await cairnFetch('/settings/itinerary', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function addCairnICloudCalendar(data: {
  appleId: string
  password: string
  name: string
  color: string
}): Promise<void> {
  await cairnFetch('/itinerary', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCairnICloudCalendar(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await cairnFetch(`/itinerary/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCairnICloudCalendar(id: string): Promise<void> {
  await cairnFetch<void>(`/itinerary/${id}`, { method: 'DELETE' })
}

export async function addCairnCalendarSubscription(data: Record<string, unknown>): Promise<void> {
  await cairnFetch('/itinerary-subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteCairnCalendarSubscription(id: string): Promise<void> {
  await cairnFetch<void>(`/itinerary-subscriptions/${id}`, { method: 'DELETE' })
}

export type CairnStarfieldNetwork = {
  id: string
  name: string
  description?: string | null
  color?: string | null
}

export async function fetchCairnStarfieldNetworks(): Promise<CairnStarfieldNetwork[]> {
  const raw = await cairnFetch<Array<CairnStarfieldNetwork & { sk?: string }>>('/starfield/networks')
  return raw.map((network) => ({
    id: network.id || (network.sk ? extractCairnId(network.sk) : ''),
    name: network.name,
    description: network.description ?? null,
    color: network.color ?? null,
  }))
}

export type CairnSearchResultType = 'waypoint' | 'log' | 'provision' | 'stop' | 'trail' | 'marker'

export type CairnSearchResult = {
  id: string
  type: CairnSearchResultType
  title: string
  subtitle?: string
  url: string
  externalUrl?: string
  color?: string
  score?: number
}

/** Map Summit/Cairn search URLs onto Fjall routes. */
export function mapCairnSearchUrlToFjall(url: string): string {
  try {
    const parsed = new URL(url, 'https://fjall.local')
    const path = parsed.pathname
    const search = parsed.search

    if (path.startsWith('/logs')) return `/sogur${search}`
    if (path.startsWith('/provisions')) return `/audr${search}`
    if (path.startsWith('/itinerary')) return `/dagatal${search}`
    if (path.startsWith('/waypoints') || path.startsWith('/trails') || path.startsWith('/markers')) {
      return `/hlidskjalf${search}`
    }
    if (path.startsWith('/manifest') || path.startsWith('/ordstirr')) return `/ordstirr${search}`
    if (path.startsWith('/signals') || path.startsWith('/messages')) return `/sendibod${search}`
    if (path.startsWith('/starfield')) return `/stjornur${search}`
    if (path === '/' || path.startsWith('/basecamp')) return '/hlidskjalf'
    return `${path}${search}` || '/hlidskjalf'
  } catch {
    return '/hlidskjalf'
  }
}

export async function searchCairn(query: string, deep = true): Promise<CairnSearchResult[]> {
  const qs = new URLSearchParams({ q: query, deep: String(deep) })
  const results = await cairnFetch<CairnSearchResult[]>(`/search?${qs}`)
  return results.map((result) => ({
    ...result,
    url: mapCairnSearchUrlToFjall(result.url),
  }))
}

export async function saveCairnSignalSettings(data: CairnSignalSettings): Promise<void> {
  await cairnFetch('/settings/signals', { method: 'PUT', body: JSON.stringify(data) })
}

// ─── Sendibóð (signals) ────────────────────────────────────────────────────

export type CairnSignalReply = {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  senderEmail?: string | null
  createdAt: string
}

export type CairnSignal = {
  id: string
  senderName: string
  senderEmail: string
  body: string
  read: boolean
  createdAt: string
  replies: CairnSignalReply[]
}

export async function fetchCairnSignals(): Promise<CairnSignal[]> {
  return cairnFetch<CairnSignal[]>('/signals')
}

export async function replyToCairnSignal(id: string, body: string): Promise<CairnSignalReply> {
  return cairnFetch<CairnSignalReply>(`/signals/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) })
}

export async function markCairnSignalRead(id: string): Promise<void> {
  await cairnFetch<void>(`/signals/${id}/read`, { method: 'PUT' })
}

export async function deleteCairnSignal(id: string): Promise<void> {
  await cairnFetch<void>(`/signals/${id}`, { method: 'DELETE' })
}

// ─── Sjodr (funds) ─────────────────────────────────────────────────────────

export async function fetchCairnSjodr(): Promise<CairnSjodrView[]> {
  const rows = await cairnFetch<CairnSjodr[]>('/sjodr')
  return rows
    .map((row) => ({
      id: extractCairnId(row.sk),
      name: row.name,
      description: row.description ?? null,
      createdAt: row.createdAt,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
}

export async function createCairnSjodr(data: SaveCairnSjodrRequest): Promise<CairnSjodrView> {
  const row = await cairnFetch<CairnSjodr>('/sjodr', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return {
    id: extractCairnId(row.sk),
    name: row.name,
    description: row.description ?? null,
    createdAt: row.createdAt,
  }
}

export async function updateCairnSjodr(
  id: string,
  data: SaveCairnSjodrRequest,
): Promise<CairnSjodrView> {
  const row = await cairnFetch<CairnSjodr>(`/sjodr/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return {
    id: extractCairnId(row.sk),
    name: row.name,
    description: row.description ?? null,
    createdAt: row.createdAt,
  }
}

export async function deleteCairnSjodr(id: string): Promise<void> {
  await cairnFetch<void>(`/sjodr/${id}`, { method: 'DELETE' })
}

// ─── Trails ────────────────────────────────────────────────────────────────

export async function fetchCairnTrails(): Promise<CairnTrail[]> {
  return cairnFetch<CairnTrail[]>('/trails')
}

export async function createCairnTrail(data: { name: string }): Promise<CairnTrailView> {
  const trail = await cairnFetch<CairnTrail>('/trails', { method: 'POST', body: JSON.stringify(data) })
  return { id: extractCairnId(trail.sk), name: trail.name, createdAt: trail.createdAt }
}

export async function updateCairnTrail(id: string, data: { name: string }): Promise<CairnTrailView> {
  const trail = await cairnFetch<CairnTrail>(`/trails/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return { id: extractCairnId(trail.sk), name: trail.name, createdAt: trail.createdAt }
}

export async function deleteCairnTrail(id: string): Promise<void> {
  await cairnFetch<void>(`/trails/${id}`, { method: 'DELETE' })
}

// ─── Markers ───────────────────────────────────────────────────────────────

export async function fetchCairnMarkers(): Promise<CairnMarker[]> {
  return cairnFetch<CairnMarker[]>('/markers')
}

export async function createCairnMarker(data: { name: string; color: string; icon?: string | null }): Promise<CairnMarkerView> {
  const marker = await cairnFetch<CairnMarker>('/markers', { method: 'POST', body: JSON.stringify(data) })
  return { id: extractCairnId(marker.sk), name: marker.name, color: marker.color, icon: marker.icon ?? null, createdAt: marker.createdAt, waypointCount: marker.waypointCount ?? 0 }
}

export async function updateCairnMarker(id: string, data: { name: string; color: string; icon?: string | null }): Promise<CairnMarkerView> {
  const marker = await cairnFetch<CairnMarker>(`/markers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return { id: extractCairnId(marker.sk), name: marker.name, color: marker.color, icon: marker.icon ?? null, createdAt: marker.createdAt, waypointCount: marker.waypointCount ?? 0 }
}

export async function deleteCairnMarker(id: string): Promise<void> {
  await cairnFetch<void>(`/markers/${id}`, { method: 'DELETE' })
}

// ─── Waypoints ─────────────────────────────────────────────────────────────

export async function fetchCairnWaypoints(): Promise<CairnWaypoint[]> {
  return cairnFetch<CairnWaypoint[]>('/waypoints')
}

export async function createCairnWaypoint(data: SaveCairnWaypointRequest): Promise<CairnWaypoint> {
  return cairnFetch<CairnWaypoint>('/waypoints', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateCairnWaypoint(
  id: string,
  data: Partial<SaveCairnWaypointRequest>,
): Promise<CairnWaypoint> {
  return cairnFetch<CairnWaypoint>(`/waypoints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteCairnWaypoint(id: string): Promise<void> {
  await cairnFetch<void>(`/waypoints/${id}`, { method: 'DELETE' })
}

export async function fetchCairnWaypointMeta(url: string): Promise<CairnWaypointMeta> {
  return cairnFetch<CairnWaypointMeta>(`/waypoints/fetch-meta?url=${encodeURIComponent(url)}`)
}

// ─── Logs (Sögur) ──────────────────────────────────────────────────────────

export type CairnLogMarker = {
  markerId: string
  marker: { id: string; name: string; color: string; icon: string | null }
}

export type CairnLogView = {
  id: string
  title: string | null
  content: string
  position: number | null
  createdAt: string
  trailId: string | null
  waypointId: string | null
  trailName: string | null
  markers: CairnLogMarker[]
}

type CairnLogRaw = {
  id?: string
  sk?: string
  title: string | null
  content: string
  position?: number | null
  createdAt: string
  trailId: string | null
  waypointId?: string | null
  trail?: { id: string; name: string } | null
  markers?: CairnLogMarker[]
}

function toCairnLogView(raw: CairnLogRaw, trailsById: Map<string, string>): CairnLogView {
  const id = raw.id ?? (raw.sk ? extractCairnId(raw.sk) : '')
  const trailId = raw.trailId ?? null
  return {
    id,
    title: raw.title,
    content: raw.content,
    position: raw.position ?? null,
    createdAt: raw.createdAt,
    trailId,
    waypointId: raw.waypointId ?? null,
    trailName: raw.trail?.name ?? (trailId ? trailsById.get(trailId) ?? null : null),
    markers: raw.markers ?? [],
  }
}

export async function fetchCairnLogs(): Promise<CairnLogView[]> {
  const [logs, trails] = await Promise.all([cairnFetch<CairnLogRaw[]>('/logs'), fetchCairnTrails()])
  const trailsById = new Map(trails.map((trail) => [extractCairnId(trail.sk), trail.name]))
  return logs.map((log) => toCairnLogView(log, trailsById))
}

export type SaveCairnLogRequest = {
  id?: string
  title: string | null
  content: string
  trailId?: string | null
  waypointId?: string | null
  markerIds?: string[]
}

export async function saveCairnLog(data: SaveCairnLogRequest): Promise<CairnLogView> {
  const { id, ...rest } = data
  const raw = id
    ? await cairnFetch<CairnLogRaw>(`/logs/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
    : await cairnFetch<CairnLogRaw>('/logs', { method: 'POST', body: JSON.stringify(rest) })
  const trails = await fetchCairnTrails()
  const trailsById = new Map(trails.map((trail) => [extractCairnId(trail.sk), trail.name]))
  return toCairnLogView(raw, trailsById)
}

export async function deleteCairnLog(id: string): Promise<void> {
  await cairnFetch<void>(`/logs/${id}`, { method: 'DELETE' })
}

export async function reorderCairnLogs(orderedIds: string[]): Promise<void> {
  await cairnFetch('/logs/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) })
}

export async function uploadCairnLogImage(file: File, logId: string): Promise<string> {
  const data = await cairnFetch<{ url: string; key: string; cloudFrontUrl?: string }>(
    '/logs/upload-url',
    { method: 'POST', body: JSON.stringify({ contentType: file.type, fileSize: file.size, logId }) },
  )
  await fetch(data.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
  if (data.cloudFrontUrl) return data.cloudFrontUrl
  return data.key
}

// ─── Audr (provisions) ─────────────────────────────────────────────────────

export async function fetchCairnProvisionsSummary(month: number, year: number): Promise<CairnProvisionsSummary> {
  return cairnFetch<CairnProvisionsSummary>(`/supplylines/summary?month=${month}&year=${year}`)
}

export type CairnBurnQueryParams = {
  month: number
  year: number
  page?: number
  search?: string
  markerId?: string
  fundId?: string
}

export async function fetchCairnBurnPage(params: CairnBurnQueryParams): Promise<CairnBurnPage> {
  const qs = new URLSearchParams({ month: String(params.month), year: String(params.year), page: String(params.page ?? 1) })
  if (params.search) qs.set('search', params.search)
  if (params.markerId) qs.set('markerId', params.markerId)
  if (params.fundId) qs.set('fundId', params.fundId)
  return cairnFetch<CairnBurnPage>(`/burn?${qs}`)
}

export type CairnSupplylineQueryParams = {
  search?: string
  markerId?: string
  active?: string
}

export async function fetchCairnSupplylinesFiltered(params: CairnSupplylineQueryParams = {}): Promise<CairnSupplyline[]> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.markerId) qs.set('markerId', params.markerId)
  if (params.active) qs.set('active', params.active)
  const query = qs.toString()
  return cairnFetch<CairnSupplyline[]>(`/supplylines${query ? `?${query}` : ''}`)
}

export async function saveCairnSupplyline(data: Record<string, unknown>): Promise<unknown> {
  const { id, nextRenewal, url, notes, active, ...rest } = data
  const path = id ? `/supplylines/${encodeURIComponent(String(id))}` : '/supplylines'
  return cairnFetch(path, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...rest, active: active ?? true, nextRenewal, url: typeof url === 'string' && url.trim() ? url.trim() : null, notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null }),
  })
}

export async function deleteCairnSupplyline(id: string): Promise<void> {
  await cairnFetch<void>(`/supplylines/${id}`, { method: 'DELETE' })
}

export async function toggleCairnSupplylineActive(id: string, active: boolean): Promise<unknown> {
  return cairnFetch(`/supplylines/${id}`, { method: 'PUT', body: JSON.stringify({ active }) })
}

export async function saveCairnBurn(data: Record<string, unknown>): Promise<unknown> {
  const { id, ...rest } = data
  const path = id ? `/burn/${id}` : '/burn'
  return cairnFetch(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(rest) })
}

export async function deleteCairnBurn(id: string): Promise<void> {
  await cairnFetch<void>(`/burn/${id}`, { method: 'DELETE' })
}

export async function fetchCairnBurnReceiptUrl(key: string): Promise<string> {
  const data = await cairnFetch<{ url: string }>(`/burn/receipt-url?key=${encodeURIComponent(key)}`)
  return data.url
}

export async function uploadCairnBurnReceipt(file: File): Promise<string> {
  const data = await cairnFetch<{ url: string; key: string; cloudFrontUrl?: string }>(
    '/burn/receipt-upload-url',
    { method: 'POST', body: JSON.stringify({ contentType: file.type, fileSize: file.size }) },
  )
  await fetch(data.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
  return data.cloudFrontUrl ?? data.key
}

export async function saveCairnCache(data: Record<string, unknown>): Promise<unknown> {
  const { id, ...rest } = data
  const path = id ? `/cache/${encodeURIComponent(String(id))}` : '/cache'
  return cairnFetch(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(rest) })
}

export async function deleteCairnCache(id: string): Promise<void> {
  await cairnFetch<void>(`/cache/${id}`, { method: 'DELETE' })
}

// ─── Dagatal (itinerary) ───────────────────────────────────────────────────

export type CairnCalendarSyncStatus = {
  calendarId: string
  name: string
  source: 'icloud' | 'subscription'
  status: 'ok' | 'not_found' | 'auth_failed' | 'error'
  eventCount: number
  availableNames?: string[]
  message?: string
}

export type CairnItineraryEventsResult = {
  events: CairnExternalCalendarEvent[]
  calendarSync: CairnCalendarSyncStatus[]
}

export async function fetchCairnItineraryCalendars(): Promise<CairnCalendarOption[]> {
  const settings = await fetchCairnFullSettings()
  const calendars = (settings.calendars ?? []).map((c) => ({ id: c.id, name: c.name, color: c.color }))
  const subscriptions = (settings.calendarSubscriptions ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
  return [...calendars, ...subscriptions]
}

export async function fetchCairnItineraryEvents(params?: { from?: string; to?: string }): Promise<CairnItineraryEventsResult> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const query = qs.toString()
  const data = await cairnFetch<{ events?: Record<string, unknown>[]; calendarSync?: CairnCalendarSyncStatus[] }>(`/itinerary/events${query ? `?${query}` : ''}`)
  return {
    events: reviveItineraryEvents(parseCairnItineraryEventsPayload(data)),
    calendarSync: Array.isArray(data.calendarSync) ? data.calendarSync : [],
  }
}

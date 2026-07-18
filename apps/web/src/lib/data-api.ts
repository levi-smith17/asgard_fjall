import { fjallFetch, fetchFjallHealth } from '@/lib/data-client'
import { FJALL_API_URL } from '@/lib/config'
import { getStoredAccessToken } from '@/lib/webauthn-client'
import type {
  FjallBurnPage,
  FjallCalendarOption,
  FjallExternalCalendarEvent,
  FjallMarker,
  FjallMarkerView,
  AudrSummary,
  FjallSjodr,
  FjallSjodrView,
  FjallSupplyline,
  FjallTrail,
  FjallTrailView,
  FjallWaypoint,
  FjallWaypointMeta,
  SaveFjallSjodrRequest,
  SaveFjallWaypointRequest,
} from '@/lib/data-types'
import { extractEntityId } from '@/lib/data-format'
import { toDisplayMarker, toMarkerId } from '@/lib/embedded-markers'
import { normalizeTerminologyStyle, type TerminologyStyle } from '@/lib/terminology'
import { parseFjallItineraryEventsPayload, reviveItineraryEvents } from '@/lib/dagatal-events'

// ─── Status ────────────────────────────────────────────────────────────────

export type FjallStatusResponse = {
  configured: boolean
  baseUrl: string
}

/**
 * Passkey session Bearer + reachable API means live data is available.
 */
export async function fetchFjallStatus(): Promise<FjallStatusResponse> {
  const health = await fetchFjallHealth()
  return {
    configured: Boolean(getStoredAccessToken()) && health.ok,
    baseUrl: FJALL_API_URL,
  }
}

// ─── Settings ──────────────────────────────────────────────────────────────

export type FjallSignalSettings = {
  messagesPerPage: number
  autoMarkRead: boolean
  autoRefreshInterval: number
  compactView: boolean
  showSnippets: boolean
  browserNotifications: boolean
  notificationSound: boolean
}

export type FjallCalendarEntry = {
  id: string
  name: string
  color: string
  appleId?: string
}

export type FjallSubscriptionEntry = {
  id: string
  name: string
  url: string
  color: string
}

export type FjallFullSettings = {
  account: {
    name: string | null
    image: string | null
    username: string | null
    timeFormat: 'TWELVE' | 'TWENTYFOUR'
    listed: boolean
    defaultTerminology: TerminologyStyle
    defaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
    customDomain: string | null
  }
  appearance: {
    sidebarDefault: 'EXPANDED' | 'COLLAPSED'
    defaultLandingPage: string
    dateFormat: 'MDY' | 'DMY' | 'YMD'
    publicDefaultTheme: 'SYSTEM' | 'LIGHT' | 'DARK'
    publicDefaultPalette: 'fjall' | 'green'
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
  waypoints: {
    defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
    openInNewTab: boolean
    waypointsPerPage: number
  }
  logs: {
    logsPerPage: number
    defaultSort: 'NEWEST' | 'OLDEST'
  }
  calendars: FjallCalendarEntry[]
  calendarSubscriptions: FjallSubscriptionEntry[]
  signals: FjallSignalSettings
}

export async function fetchFjallFullSettings(): Promise<FjallFullSettings> {
  const raw = await fjallFetch<Record<string, any>>('/settings')
  const account = raw.account ?? {}
  return {
    ...raw,
    account: {
      ...account,
      defaultTerminology: normalizeTerminologyStyle(account.defaultTerminology),
    },
    itinerary: raw.itinerary ?? raw.dagatal,
    waypoints: raw.waypoints ?? {
      defaultSort: raw.laufar?.defaultSort,
      openInNewTab: raw.laufar?.openInNewTab,
      waypointsPerPage: raw.laufar?.laufarPerPage ?? raw.laufar?.waypointsPerPage,
    },
    logs: raw.logs ?? {
      logsPerPage: raw.sogur?.sogurPerPage ?? raw.sogur?.logsPerPage,
      defaultSort: raw.sogur?.defaultSort,
    },
    calendars: raw.calendars,
    calendarSubscriptions: raw.calendarSubscriptions,
    signals: raw.signals ?? raw.sendibod,
  } as FjallFullSettings
}

export type FjallProfile = {
  username: string | null
  name: string | null
  email: string | null
  image: string | null
  isAdmin: boolean
}

export async function fetchFjallProfile(): Promise<FjallProfile> {
  return fjallFetch<FjallProfile>('/profile')
}

export async function saveFjallAccountSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/account', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveFjallPrivacySettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/privacy', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveFjallListedSetting(listed: boolean): Promise<void> {
  await fjallFetch('/settings/account', {
    method: 'PUT',
    body: JSON.stringify({ listed }),
  })
}

export async function saveFjallItinerarySettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/itinerary', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveFjallAppearanceSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/appearance', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveFjallWaypointSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/waypoints', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function saveFjallLogSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/logs', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export type FjallApiTokenStatus = {
  configured: boolean
  tokenPrefix: string | null
  lastUsedAt: string | null
}

export async function fetchFjallApiTokenStatus(): Promise<FjallApiTokenStatus> {
  return fjallFetch<FjallApiTokenStatus>('/settings/api-token')
}

export async function createFjallApiToken(): Promise<{ token: string }> {
  return fjallFetch<{ token: string }>('/settings/api-token', { method: 'POST' })
}

export async function revokeFjallApiToken(): Promise<void> {
  await fjallFetch<void>('/settings/api-token', { method: 'DELETE' })
}

export async function addFjallICloudCalendar(data: {
  appleId: string
  password: string
  name: string
  color: string
}): Promise<void> {
  await fjallFetch('/itinerary', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateFjallICloudCalendar(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await fjallFetch(`/itinerary/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallICloudCalendar(id: string): Promise<void> {
  await fjallFetch<void>(`/itinerary/${id}`, { method: 'DELETE' })
}

export async function addFjallCalendarSubscription(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/itinerary-subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallCalendarSubscription(id: string): Promise<void> {
  await fjallFetch<void>(`/itinerary-subscriptions/${id}`, { method: 'DELETE' })
}

export type FjallStarfieldNetwork = {
  id: string
  name: string
  description?: string | null
  color?: string | null
}

export async function fetchFjallStarfieldNetworks(): Promise<FjallStarfieldNetwork[]> {
  const raw = await fjallFetch<Array<FjallStarfieldNetwork & { sk?: string }>>('/starfield/networks')
  return raw.map((network) => ({
    id: network.id || (network.sk ? extractEntityId(network.sk) : ''),
    name: network.name,
    description: network.description ?? null,
    color: network.color ?? null,
  }))
}

export type FjallSearchResultType = 'waypoint' | 'log' | 'provision' | 'stop' | 'trail' | 'marker'

export type FjallSearchResult = {
  id: string
  type: FjallSearchResultType
  title: string
  subtitle?: string
  url: string
  externalUrl?: string
  color?: string
  score?: number
}

/** Map Summit/Fjall search URLs onto Fjall routes. */
export function mapLegacySearchUrlToFjall(url: string): string {
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

export async function searchFjall(query: string, deep = true): Promise<FjallSearchResult[]> {
  const qs = new URLSearchParams({ q: query, deep: String(deep) })
  const results = await fjallFetch<FjallSearchResult[]>(`/search?${qs}`)
  return results.map((result) => ({
    ...result,
    url: mapLegacySearchUrlToFjall(result.url),
  }))
}

export async function saveFjallSignalSettings(data: FjallSignalSettings): Promise<void> {
  await fjallFetch('/settings/signals', { method: 'PUT', body: JSON.stringify(data) })
}

// ─── Sendibóð (signals) ────────────────────────────────────────────────────

export type FjallSignalReply = {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  senderEmail?: string | null
  createdAt: string
}

export type FjallSignal = {
  id: string
  senderName: string
  senderEmail: string
  body: string
  read: boolean
  createdAt: string
  replies: FjallSignalReply[]
}

export async function fetchFjallSignals(): Promise<FjallSignal[]> {
  return fjallFetch<FjallSignal[]>('/signals')
}

export async function replyToFjallSignal(id: string, body: string): Promise<FjallSignalReply> {
  return fjallFetch<FjallSignalReply>(`/signals/${id}/reply`, { method: 'POST', body: JSON.stringify({ body }) })
}

export async function markFjallSignalRead(id: string): Promise<void> {
  await fjallFetch<void>(`/signals/${id}/read`, { method: 'PUT' })
}

export async function deleteFjallSignal(id: string): Promise<void> {
  await fjallFetch<void>(`/signals/${id}`, { method: 'DELETE' })
}

// ─── Sjodr (funds) ─────────────────────────────────────────────────────────

export async function fetchFjallSjodr(): Promise<FjallSjodrView[]> {
  const rows = await fjallFetch<FjallSjodr[]>('/sjodr')
  return rows
    .map((row) => ({
      id: extractEntityId(row.sk),
      name: row.name,
      description: row.description ?? null,
      color: row.color?.trim() || null,
      createdAt: row.createdAt,
    }))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { sensitivity: 'base' }))
}

export async function createFjallSjodr(data: SaveFjallSjodrRequest): Promise<FjallSjodrView> {
  const row = await fjallFetch<FjallSjodr>('/sjodr', {
    method: 'POST',
    body: JSON.stringify(data),
  })
  return {
    id: extractEntityId(row.sk),
    name: row.name,
    description: row.description ?? null,
    color: row.color?.trim() || null,
    createdAt: row.createdAt,
  }
}

export async function updateFjallSjodr(
  id: string,
  data: SaveFjallSjodrRequest,
): Promise<FjallSjodrView> {
  const row = await fjallFetch<FjallSjodr>(`/sjodr/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  return {
    id: extractEntityId(row.sk),
    name: row.name,
    description: row.description ?? null,
    color: row.color?.trim() || null,
    createdAt: row.createdAt,
  }
}

export async function deleteFjallSjodr(id: string): Promise<void> {
  await fjallFetch<void>(`/sjodr/${id}`, { method: 'DELETE' })
}

// ─── Trails ────────────────────────────────────────────────────────────────

export async function fetchFjallTrails(): Promise<FjallTrail[]> {
  return fjallFetch<FjallTrail[]>('/trails')
}

export async function createFjallTrail(data: { name: string; hiddenPages?: string[] }): Promise<FjallTrailView> {
  const trail = await fjallFetch<FjallTrail>('/trails', { method: 'POST', body: JSON.stringify(data) })
  return {
    id: extractEntityId(trail.sk),
    name: trail.name,
    hiddenPages: Array.isArray(trail.hiddenPages) ? trail.hiddenPages : null,
    createdAt: trail.createdAt,
  }
}

export async function updateFjallTrail(
  id: string,
  data: { name: string; hiddenPages?: string[] },
): Promise<FjallTrailView> {
  const trail = await fjallFetch<FjallTrail>(`/trails/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return {
    id: extractEntityId(trail.sk),
    name: trail.name,
    hiddenPages: Array.isArray(trail.hiddenPages) ? trail.hiddenPages : null,
    createdAt: trail.createdAt,
  }
}

export async function deleteFjallTrail(id: string): Promise<void> {
  await fjallFetch<void>(`/trails/${id}`, { method: 'DELETE' })
}

// ─── Markers ───────────────────────────────────────────────────────────────

export async function fetchFjallMarkers(): Promise<FjallMarker[]> {
  return fjallFetch<FjallMarker[]>('/markers')
}

export async function createFjallMarker(data: { name: string; color: string; icon?: string | null }): Promise<FjallMarkerView> {
  const marker = await fjallFetch<FjallMarker>('/markers', { method: 'POST', body: JSON.stringify(data) })
  return { id: extractEntityId(marker.sk), name: marker.name, color: marker.color, icon: marker.icon ?? null, createdAt: marker.createdAt, waypointCount: marker.waypointCount ?? 0 }
}

export async function updateFjallMarker(id: string, data: { name: string; color: string; icon?: string | null }): Promise<FjallMarkerView> {
  const marker = await fjallFetch<FjallMarker>(`/markers/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return { id: extractEntityId(marker.sk), name: marker.name, color: marker.color, icon: marker.icon ?? null, createdAt: marker.createdAt, waypointCount: marker.waypointCount ?? 0 }
}

export async function deleteFjallMarker(id: string): Promise<void> {
  await fjallFetch<void>(`/markers/${id}`, { method: 'DELETE' })
}

// ─── Waypoints ─────────────────────────────────────────────────────────────

export async function fetchFjallWaypoints(): Promise<FjallWaypoint[]> {
  return fjallFetch<FjallWaypoint[]>('/waypoints')
}

export async function createFjallWaypoint(data: SaveFjallWaypointRequest): Promise<FjallWaypoint> {
  return fjallFetch<FjallWaypoint>('/waypoints', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateFjallWaypoint(
  id: string,
  data: Partial<SaveFjallWaypointRequest>,
): Promise<FjallWaypoint> {
  return fjallFetch<FjallWaypoint>(`/waypoints/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallWaypoint(id: string): Promise<void> {
  await fjallFetch<void>(`/waypoints/${id}`, { method: 'DELETE' })
}

export async function fetchFjallWaypointMeta(url: string): Promise<FjallWaypointMeta> {
  return fjallFetch<FjallWaypointMeta>(`/waypoints/fetch-meta?url=${encodeURIComponent(url)}`)
}

// ─── Logs / Thattr (Sögur) ─────────────────────────────────────────────────

export type FjallLogMarker = {
  markerId: string
  marker: { id: string; name: string; color: string; icon: string | null }
}

/** Normalize flat embedded Run snapshots and legacy `{ markerId, marker }` junctions. */
export function normalizeFjallLogMarkers(rawMarkers: unknown): FjallLogMarker[] {
  if (!Array.isArray(rawMarkers)) return []
  const out: FjallLogMarker[] = []
  for (const entry of rawMarkers) {
    const markerId = toMarkerId(entry)
    const display = toDisplayMarker(entry)
    if (!markerId || !display) continue
    out.push({
      markerId,
      marker: {
        id: display.id,
        name: display.name,
        color: display.color,
        icon: display.icon ?? null,
      },
    })
  }
  return out
}

export type FjallLogView = {
  id: string
  title: string | null
  content: string
  position: number | null
  createdAt: string
  updatedAt?: string | null
  sagaId: string | null
  trailId: string | null
  waypointId: string | null
  trailName: string | null
  markers: FjallLogMarker[]
}

type FjallLogRaw = {
  id?: string
  sk?: string
  title?: string | null
  content: string
  position?: number | null
  createdAt: string
  updatedAt?: string | null
  sagaId?: string | null
  trailId?: string | null
  waypointId?: string | null
  trail?: { id: string; name: string } | null
  markers?: unknown
}

function toFjallLogView(raw: FjallLogRaw, trailsById: Map<string, string>): FjallLogView {
  const id = raw.id ?? (raw.sk ? extractEntityId(raw.sk) : '')
  const trailId = raw.trailId ?? null
  return {
    id,
    title: raw.title ?? null,
    content: raw.content,
    position: raw.position ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    sagaId: raw.sagaId ?? null,
    trailId,
    waypointId: raw.waypointId ?? null,
    trailName: raw.trail?.name ?? (trailId ? trailsById.get(trailId) ?? null : null),
    markers: normalizeFjallLogMarkers(raw.markers),
  }
}

export async function fetchFjallLogs(): Promise<FjallLogView[]> {
  const [logs, trails] = await Promise.all([fjallFetch<FjallLogRaw[]>('/logs'), fetchFjallTrails()])
  const trailsById = new Map(trails.map((trail) => [extractEntityId(trail.sk), trail.name]))
  return logs.map((log) => toFjallLogView(log, trailsById))
}

export type SaveFjallLogRequest = {
  id?: string
  title: string | null
  content: string
  sagaId?: string | null
  trailId?: string | null
  waypointId?: string | null
  markerIds?: string[]
}

export async function saveFjallLog(data: SaveFjallLogRequest): Promise<FjallLogView> {
  const { id, ...rest } = data
  const raw = id
    ? await fjallFetch<FjallLogRaw>(`/logs/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
    : await fjallFetch<FjallLogRaw>('/logs', { method: 'POST', body: JSON.stringify(rest) })
  const trails = await fetchFjallTrails()
  const trailsById = new Map(trails.map((trail) => [extractEntityId(trail.sk), trail.name]))
  return toFjallLogView(raw, trailsById)
}

export async function deleteFjallLog(id: string): Promise<void> {
  await fjallFetch<void>(`/logs/${id}`, { method: 'DELETE' })
}

export async function reorderFjallLogs(orderedIds: string[]): Promise<void> {
  await fjallFetch('/logs/reorder', { method: 'PUT', body: JSON.stringify({ orderedIds }) })
}

export async function uploadFjallLogImage(file: File, logId: string): Promise<string> {
  const data = await fjallFetch<{ url: string; key: string; cloudFrontUrl?: string }>(
    '/logs/upload-url',
    { method: 'POST', body: JSON.stringify({ contentType: file.type, fileSize: file.size, logId }) },
  )
  await fetch(data.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
  if (data.cloudFrontUrl) return data.cloudFrontUrl
  return data.key
}

// ─── Sagas (Sögur containers) ──────────────────────────────────────────────

export type FjallSagaView = {
  id: string
  name: string
  trailId: string | null
  trailName: string | null
  orderedThattrIds: string[]
  markers: FjallLogMarker[]
  createdAt: string
  updatedAt: string | null
}

type FjallSagaRaw = {
  id?: string
  sk?: string
  name: string
  trailId?: string | null
  orderedThattrIds?: string[]
  markers?: unknown
  createdAt: string
  updatedAt?: string | null
}

function toFjallSagaView(raw: FjallSagaRaw, trailsById: Map<string, string>): FjallSagaView {
  const id = raw.id ?? (raw.sk ? extractEntityId(raw.sk) : '')
  const trailId = raw.trailId ?? null
  return {
    id,
    name: raw.name,
    trailId,
    trailName: trailId ? trailsById.get(trailId) ?? null : null,
    orderedThattrIds: Array.isArray(raw.orderedThattrIds) ? raw.orderedThattrIds : [],
    markers: normalizeFjallLogMarkers(raw.markers),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
  }
}

export async function fetchFjallSagas(): Promise<FjallSagaView[]> {
  const [sagas, trails] = await Promise.all([
    fjallFetch<FjallSagaRaw[]>('/logs/sagas'),
    fetchFjallTrails(),
  ])
  const trailsById = new Map(trails.map((trail) => [extractEntityId(trail.sk), trail.name]))
  return sagas.map((saga) => toFjallSagaView(saga, trailsById))
}

export type SaveFjallSagaRequest = {
  id?: string
  name: string
  trailId?: string | null
  markerIds?: string[]
}

export async function saveFjallSaga(data: SaveFjallSagaRequest): Promise<FjallSagaView> {
  const { id, ...rest } = data
  const raw = id
    ? await fjallFetch<FjallSagaRaw>(`/logs/sagas/${id}`, {
        method: 'PUT',
        body: JSON.stringify(rest),
      })
    : await fjallFetch<FjallSagaRaw>('/logs/sagas', {
        method: 'POST',
        body: JSON.stringify(rest),
      })
  const trails = await fetchFjallTrails()
  const trailsById = new Map(trails.map((trail) => [extractEntityId(trail.sk), trail.name]))
  return toFjallSagaView(raw, trailsById)
}

export async function deleteFjallSaga(id: string): Promise<void> {
  await fjallFetch<void>(`/logs/sagas/${id}`, { method: 'DELETE' })
}

export async function reorderFjallSaga(
  sagaId: string,
  orderedThattrIds: string[],
): Promise<FjallSagaView> {
  const raw = await fjallFetch<FjallSagaRaw>(`/logs/sagas/${sagaId}/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ orderedThattrIds }),
  })
  const trails = await fetchFjallTrails()
  const trailsById = new Map(trails.map((trail) => [extractEntityId(trail.sk), trail.name]))
  return toFjallSagaView(raw, trailsById)
}

// ─── Audr (provisions) ─────────────────────────────────────────────────────

export async function fetchProvisionsSummary(month: number, year: number): Promise<AudrSummary> {
  return fjallFetch<AudrSummary>(`/supplylines/summary?month=${month}&year=${year}`)
}

export type FjallBurnQueryParams = {
  month: number
  year: number
  page?: number
  search?: string
  markerId?: string
  fundId?: string
}

export async function fetchFjallBurnPage(params: FjallBurnQueryParams): Promise<FjallBurnPage> {
  const qs = new URLSearchParams({ month: String(params.month), year: String(params.year), page: String(params.page ?? 1) })
  if (params.search) qs.set('search', params.search)
  if (params.markerId) qs.set('markerId', params.markerId)
  if (params.fundId) qs.set('fundId', params.fundId)
  return fjallFetch<FjallBurnPage>(`/burn?${qs}`)
}

export type FjallSupplylineQueryParams = {
  search?: string
  markerId?: string
  active?: string
}

export async function fetchFjallSupplylinesFiltered(params: FjallSupplylineQueryParams = {}): Promise<FjallSupplyline[]> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.markerId) qs.set('markerId', params.markerId)
  if (params.active) qs.set('active', params.active)
  const query = qs.toString()
  return fjallFetch<FjallSupplyline[]>(`/supplylines${query ? `?${query}` : ''}`)
}

export async function saveFjallSupplyline(data: Record<string, unknown>): Promise<unknown> {
  const { id, nextRenewal, url, notes, active, ...rest } = data
  const path = id ? `/supplylines/${encodeURIComponent(String(id))}` : '/supplylines'
  return fjallFetch(path, {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...rest, active: active ?? true, nextRenewal, url: typeof url === 'string' && url.trim() ? url.trim() : null, notes: typeof notes === 'string' && notes.trim() ? notes.trim() : null }),
  })
}

export async function deleteFjallSupplyline(id: string): Promise<void> {
  await fjallFetch<void>(`/supplylines/${id}`, { method: 'DELETE' })
}

export async function toggleFjallSupplylineActive(id: string, active: boolean): Promise<unknown> {
  return fjallFetch(`/supplylines/${id}`, { method: 'PUT', body: JSON.stringify({ active }) })
}

export async function saveFjallBurn(data: Record<string, unknown>): Promise<unknown> {
  const { id, ...rest } = data
  const path = id ? `/burn/${id}` : '/burn'
  return fjallFetch(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(rest) })
}

export async function deleteFjallBurn(id: string): Promise<void> {
  await fjallFetch<void>(`/burn/${id}`, { method: 'DELETE' })
}

export async function fetchFjallBurnReceiptUrl(key: string): Promise<string> {
  const data = await fjallFetch<{ url: string }>(`/burn/receipt-url?key=${encodeURIComponent(key)}`)
  return data.url
}

export async function uploadFjallBurnReceipt(file: File): Promise<string> {
  const data = await fjallFetch<{ url: string; key: string; cloudFrontUrl?: string }>(
    '/burn/receipt-upload-url',
    { method: 'POST', body: JSON.stringify({ contentType: file.type, fileSize: file.size }) },
  )
  await fetch(data.url, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file })
  return data.cloudFrontUrl ?? data.key
}

export async function saveFjallCache(data: Record<string, unknown>): Promise<unknown> {
  const { id, ...rest } = data
  const path = id ? `/cache/${encodeURIComponent(String(id))}` : '/cache'
  return fjallFetch(path, { method: id ? 'PUT' : 'POST', body: JSON.stringify(rest) })
}

export async function deleteFjallCache(id: string): Promise<void> {
  await fjallFetch<void>(`/cache/${id}`, { method: 'DELETE' })
}

// ─── Dagatal (itinerary) ───────────────────────────────────────────────────

export type FjallCalendarSyncStatus = {
  calendarId: string
  name: string
  source: 'icloud' | 'subscription'
  status: 'ok' | 'not_found' | 'auth_failed' | 'error'
  eventCount: number
  availableNames?: string[]
  message?: string
}

export type FjallItineraryEventsResult = {
  events: FjallExternalCalendarEvent[]
  calendarSync: FjallCalendarSyncStatus[]
}

export async function fetchFjallItineraryCalendars(): Promise<FjallCalendarOption[]> {
  const settings = await fetchFjallFullSettings()
  const calendars = (settings.calendars ?? []).map((c) => ({ id: c.id, name: c.name, color: c.color }))
  const subscriptions = (settings.calendarSubscriptions ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
  return [...calendars, ...subscriptions]
}

export async function fetchFjallItineraryEvents(params?: { from?: string; to?: string }): Promise<FjallItineraryEventsResult> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const query = qs.toString()
  const data = await fjallFetch<{ events?: Record<string, unknown>[]; calendarSync?: FjallCalendarSyncStatus[] }>(`/itinerary/events${query ? `?${query}` : ''}`)
  return {
    events: reviveItineraryEvents(parseFjallItineraryEventsPayload(data)),
    calendarSync: Array.isArray(data.calendarSync) ? data.calendarSync : [],
  }
}

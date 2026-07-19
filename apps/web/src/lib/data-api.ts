import { fjallFetch, fetchFjallHealth } from '@/lib/data-client'
import { FJALL_API_URL } from '@/lib/config'
import { getStoredAccessToken } from '@/lib/webauthn-client'
import type {
  FjallBurnPage,
  FjallBurn,
  FjallCalendarOption,
  FjallExternalCalendarEvent,
  FjallRun,
  FjallRunView,
  AudrSummary,
  FjallSjodr,
  FjallSjodrView,
  FjallSupplyline,
  FjallGrein,
  FjallGreinView,
  FjallLauf,
  FjallLaufMeta,
  SaveFjallSjodrRequest,
  SaveFjallLaufRequest,
} from '@/lib/data-types'
import { extractEntityId } from '@/lib/data-format'
import { toDisplayRun, toRunId } from '@/lib/embedded-runir'
import { normalizeTerminologyStyle, type TerminologyStyle } from '@/lib/terminology'
import { parseFjallDagatalEventsPayload, reviveDagatalEvents } from '@/lib/dagatal-events'

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
  dagatal: {
    defaultView: 'MONTH' | 'WEEK' | 'DAY'
    firstDayOfWeek: 'SUNDAY' | 'MONDAY'
    defaultEventDuration: number
    showWeekNumbers: boolean
  }
  laufar: {
    defaultSort: 'NEWEST' | 'OLDEST' | 'TITLE_ASC' | 'TITLE_DESC'
    openInNewTab: boolean
    laufarPerPage: number
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
    dagatal: raw.dagatal,
    laufar: raw.laufar ?? {
      defaultSort: raw.laufar?.defaultSort,
      openInNewTab: raw.laufar?.openInNewTab,
      laufarPerPage: raw.laufar?.laufarPerPage ?? raw.laufar?.laufarPerPage,
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

export async function saveFjallDagatalSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/dagatal', {
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

export async function saveFjallLaufSettings(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/settings/laufar', {
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
  await fjallFetch('/dagatal', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateFjallICloudCalendar(
  id: string,
  data: Record<string, unknown>,
): Promise<void> {
  await fjallFetch(`/dagatal/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallICloudCalendar(id: string): Promise<void> {
  await fjallFetch<void>(`/dagatal/${id}`, { method: 'DELETE' })
}

export async function addFjallCalendarSubscription(data: Record<string, unknown>): Promise<void> {
  await fjallFetch('/dagatal-subscriptions', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallCalendarSubscription(id: string): Promise<void> {
  await fjallFetch<void>(`/dagatal-subscriptions/${id}`, { method: 'DELETE' })
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

export type FjallSearchResultType = 'lauf' | 'log' | 'provision' | 'stop' | 'grein' | 'run'

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
    if (path.startsWith('/dagatal')) return `/dagatal${search}`
    if (path.startsWith('/laufar') || path.startsWith('/greinar') || path.startsWith('/runir')) {
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

// ─── Greinar ────────────────────────────────────────────────────────────────

export async function fetchFjallGreinar(): Promise<FjallGrein[]> {
  return fjallFetch<FjallGrein[]>('/greinar')
}

export async function createFjallGrein(data: { name: string; hiddenPages?: string[] }): Promise<FjallGreinView> {
  const grein = await fjallFetch<FjallGrein>('/greinar', { method: 'POST', body: JSON.stringify(data) })
  return {
    id: extractEntityId(grein.sk),
    name: grein.name,
    hiddenPages: Array.isArray(grein.hiddenPages) ? grein.hiddenPages : null,
    createdAt: grein.createdAt,
  }
}

export async function updateFjallGrein(
  id: string,
  data: { name: string; hiddenPages?: string[] },
): Promise<FjallGreinView> {
  const grein = await fjallFetch<FjallGrein>(`/greinar/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return {
    id: extractEntityId(grein.sk),
    name: grein.name,
    hiddenPages: Array.isArray(grein.hiddenPages) ? grein.hiddenPages : null,
    createdAt: grein.createdAt,
  }
}

export async function deleteFjallGrein(id: string): Promise<void> {
  await fjallFetch<void>(`/greinar/${id}`, { method: 'DELETE' })
}

// ─── Runir ───────────────────────────────────────────────────────────────

export async function fetchFjallRunir(): Promise<FjallRun[]> {
  return fjallFetch<FjallRun[]>('/runir')
}

export async function createFjallRun(data: { name: string; color: string; icon?: string | null }): Promise<FjallRunView> {
  const run = await fjallFetch<FjallRun>('/runir', { method: 'POST', body: JSON.stringify(data) })
  return { id: extractEntityId(run.sk), name: run.name, color: run.color, icon: run.icon ?? null, createdAt: run.createdAt, laufCount: run.laufCount ?? 0 }
}

export async function updateFjallRun(id: string, data: { name: string; color: string; icon?: string | null }): Promise<FjallRunView> {
  const run = await fjallFetch<FjallRun>(`/runir/${id}`, { method: 'PUT', body: JSON.stringify(data) })
  return { id: extractEntityId(run.sk), name: run.name, color: run.color, icon: run.icon ?? null, createdAt: run.createdAt, laufCount: run.laufCount ?? 0 }
}

export async function deleteFjallRun(id: string): Promise<void> {
  await fjallFetch<void>(`/runir/${id}`, { method: 'DELETE' })
}

// ─── Laufar ─────────────────────────────────────────────────────────────

export async function fetchFjallLaufar(): Promise<FjallLauf[]> {
  return fjallFetch<FjallLauf[]>('/laufar')
}

export async function createFjallLauf(data: SaveFjallLaufRequest): Promise<FjallLauf> {
  return fjallFetch<FjallLauf>('/laufar', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateFjallLauf(
  id: string,
  data: Partial<SaveFjallLaufRequest>,
): Promise<FjallLauf> {
  return fjallFetch<FjallLauf>(`/laufar/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteFjallLauf(id: string): Promise<void> {
  await fjallFetch<void>(`/laufar/${id}`, { method: 'DELETE' })
}

export async function fetchFjallLaufMeta(url: string): Promise<FjallLaufMeta> {
  return fjallFetch<FjallLaufMeta>(`/laufar/fetch-meta?url=${encodeURIComponent(url)}`)
}

// ─── Logs / Thattr (Sögur) ─────────────────────────────────────────────────

export type FjallLogRun = {
  runId: string
  run: { id: string; name: string; color: string; icon: string | null }
}

/** Normalize flat embedded Run snapshots and legacy `{ runId, run }` junctions. */
export function normalizeFjallLogRunir(rawRunir: unknown): FjallLogRun[] {
  if (!Array.isArray(rawRunir)) return []
  const out: FjallLogRun[] = []
  for (const entry of rawRunir) {
    const runId = toRunId(entry)
    const display = toDisplayRun(entry)
    if (!runId || !display) continue
    out.push({
      runId,
      run: {
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
  greinId: string | null
  laufId: string | null
  greinName: string | null
  runir: FjallLogRun[]
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
  greinId?: string | null
  trailId?: string | null
  laufId?: string | null
  waypointId?: string | null
  grein?: { id: string; name: string } | null
  runir?: unknown
  markers?: unknown
}

function toFjallLogView(raw: FjallLogRaw, greinarById: Map<string, string>): FjallLogView {
  const id = raw.id ?? (raw.sk ? extractEntityId(raw.sk) : '')
  const greinId = raw.greinId ?? raw.trailId ?? null
  const laufId = raw.laufId ?? raw.waypointId ?? null
  return {
    id,
    title: raw.title ?? null,
    content: raw.content,
    position: raw.position ?? null,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
    sagaId: raw.sagaId ?? null,
    greinId,
    laufId,
    greinName: raw.grein?.name ?? (greinId ? greinarById.get(greinId) ?? null : null),
    runir: normalizeFjallLogRunir(raw.runir ?? raw.markers),
  }
}

export async function fetchFjallLogs(): Promise<FjallLogView[]> {
  const [logs, greinar] = await Promise.all([fjallFetch<FjallLogRaw[]>('/logs'), fetchFjallGreinar()])
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  return logs.map((log) => toFjallLogView(log, greinarById))
}

export type SaveFjallLogRequest = {
  id?: string
  title: string | null
  content: string
  sagaId?: string | null
  greinId?: string | null
  laufId?: string | null
  runIds?: string[]
}

export async function saveFjallLog(data: SaveFjallLogRequest): Promise<FjallLogView> {
  const { id, ...rest } = data
  const raw = id
    ? await fjallFetch<FjallLogRaw>(`/logs/${id}`, { method: 'PUT', body: JSON.stringify(rest) })
    : await fjallFetch<FjallLogRaw>('/logs', { method: 'POST', body: JSON.stringify(rest) })
  const greinar = await fetchFjallGreinar()
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  return toFjallLogView(raw, greinarById)
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
  greinId: string | null
  greinName: string | null
  orderedThattrIds: string[]
  runir: FjallLogRun[]
  createdAt: string
  updatedAt: string | null
}

type FjallSagaRaw = {
  id?: string
  sk?: string
  name: string
  greinId?: string | null
  trailId?: string | null
  orderedThattrIds?: string[]
  runir?: unknown
  markers?: unknown
  createdAt: string
  updatedAt?: string | null
}

function toFjallSagaView(raw: FjallSagaRaw, greinarById: Map<string, string>): FjallSagaView {
  const id = raw.id ?? (raw.sk ? extractEntityId(raw.sk) : '')
  const greinId = raw.greinId ?? raw.trailId ?? null
  return {
    id,
    name: raw.name,
    greinId,
    greinName: greinId ? greinarById.get(greinId) ?? null : null,
    orderedThattrIds: Array.isArray(raw.orderedThattrIds) ? raw.orderedThattrIds : [],
    runir: normalizeFjallLogRunir(raw.runir ?? raw.markers),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt ?? null,
  }
}

export async function fetchFjallSagas(): Promise<FjallSagaView[]> {
  const [sagas, greinar] = await Promise.all([
    fjallFetch<FjallSagaRaw[]>('/logs/sagas'),
    fetchFjallGreinar(),
  ])
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  return sagas.map((saga) => toFjallSagaView(saga, greinarById))
}

export type SaveFjallSagaRequest = {
  id?: string
  name: string
  greinId?: string | null
  runIds?: string[]
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
  const greinar = await fetchFjallGreinar()
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  return toFjallSagaView(raw, greinarById)
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
  const greinar = await fetchFjallGreinar()
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  return toFjallSagaView(raw, greinarById)
}

// ─── Audr (provisions) ─────────────────────────────────────────────────────

function normalizeFjallBurn(burn: FjallBurn): FjallBurn {
  return {
    ...burn,
    runir: normalizeFjallLogRunir(burn.runir ?? burn.markers).map((entry) => ({
      runId: entry.runId,
      run: {
        id: entry.run.id,
        name: entry.run.name,
        color: entry.run.color,
        ...(entry.run.icon != null ? { icon: entry.run.icon } : {}),
      },
    })),
  }
}

function normalizeFjallSupplyline(supplyline: FjallSupplyline): FjallSupplyline {
  return {
    ...supplyline,
    runir: normalizeFjallLogRunir(supplyline.runir ?? supplyline.markers).map((entry) => ({
      runId: entry.runId,
      run: {
        id: entry.run.id,
        name: entry.run.name,
        color: entry.run.color,
        ...(entry.run.icon != null ? { icon: entry.run.icon } : {}),
      },
    })),
  }
}

export async function fetchProvisionsSummary(month: number, year: number): Promise<AudrSummary> {
  return fjallFetch<AudrSummary>(`/supplylines/summary?month=${month}&year=${year}`)
}

export type FjallBurnQueryParams = {
  month: number
  year: number
  page?: number
  search?: string
  runId?: string
  fundId?: string
}

export async function fetchFjallBurnPage(params: FjallBurnQueryParams): Promise<FjallBurnPage> {
  const qs = new URLSearchParams({ month: String(params.month), year: String(params.year), page: String(params.page ?? 1) })
  if (params.search) qs.set('search', params.search)
  if (params.runId) qs.set('runId', params.runId)
  if (params.fundId) qs.set('fundId', params.fundId)
  const page = await fjallFetch<FjallBurnPage>(`/burn?${qs}`)
  return {
    ...page,
    burn: (page.burn ?? []).map(normalizeFjallBurn),
  }
}

export type FjallSupplylineQueryParams = {
  search?: string
  runId?: string
  active?: string
}

export async function fetchFjallSupplylinesFiltered(params: FjallSupplylineQueryParams = {}): Promise<FjallSupplyline[]> {
  const qs = new URLSearchParams()
  if (params.search) qs.set('search', params.search)
  if (params.runId) qs.set('runId', params.runId)
  if (params.active) qs.set('active', params.active)
  const query = qs.toString()
  const rows = await fjallFetch<FjallSupplyline[]>(`/supplylines${query ? `?${query}` : ''}`)
  return rows.map(normalizeFjallSupplyline)
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

// ─── Dagatal (dagatal) ───────────────────────────────────────────────────

export type FjallCalendarSyncStatus = {
  calendarId: string
  name: string
  source: 'icloud' | 'subscription'
  status: 'ok' | 'not_found' | 'auth_failed' | 'error'
  eventCount: number
  availableNames?: string[]
  message?: string
}

export type FjallDagatalEventsResult = {
  events: FjallExternalCalendarEvent[]
  calendarSync: FjallCalendarSyncStatus[]
}

export async function fetchFjallDagatalCalendars(): Promise<FjallCalendarOption[]> {
  const settings = await fetchFjallFullSettings()
  const calendars = (settings.calendars ?? []).map((c) => ({ id: c.id, name: c.name, color: c.color }))
  const subscriptions = (settings.calendarSubscriptions ?? []).map((s) => ({ id: s.id, name: s.name, color: s.color }))
  return [...calendars, ...subscriptions]
}

export async function fetchFjallDagatalEvents(params?: { from?: string; to?: string }): Promise<FjallDagatalEventsResult> {
  const qs = new URLSearchParams()
  if (params?.from) qs.set('from', params.from)
  if (params?.to) qs.set('to', params.to)
  const query = qs.toString()
  const data = await fjallFetch<{ events?: Record<string, unknown>[]; calendarSync?: FjallCalendarSyncStatus[] }>(`/dagatal/events${query ? `?${query}` : ''}`)
  return {
    events: reviveDagatalEvents(parseFjallDagatalEventsPayload(data)),
    calendarSync: Array.isArray(data.calendarSync) ? data.calendarSync : [],
  }
}

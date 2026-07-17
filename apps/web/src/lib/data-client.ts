import { CAIRN_API_URL } from '@/lib/config'
import { mapCairnApiPathToAsgard } from '@/lib/map-api-path'

export class CairnApiError extends Error {
  status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export type CairnAuthProvider = () => Promise<string | null>

let authProvider: CairnAuthProvider = async () => null

/** Wire Cognito (or BFF session) token retrieval here. */
export function setCairnAuthProvider(provider: CairnAuthProvider) {
  authProvider = provider
}

export async function cairnFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = await authProvider()
  const headers = new Headers(init?.headers)
  headers.set('Accept', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)
  if (init?.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const mappedPath = mapCairnApiPathToAsgard(path)
  const response = await fetch(`${CAIRN_API_URL}${mappedPath}`, {
    ...init,
    headers,
    credentials: 'omit',
  })

  if (!response.ok) {
    const text = await response.text().catch(() => '')
    throw new CairnApiError(response.status, text || response.statusText)
  }

  if (response.status === 204) return undefined as T

  // Cairn often returns empty bodies on writes (even with 200).
  const text = await response.text().catch(() => '')
  if (!text.trim()) return undefined as T

  const json = JSON.parse(text) as T | { data: T }
  if (json != null && typeof json === 'object' && 'data' in (json as object)) {
    return (json as { data: T }).data
  }
  return json as T
}

export async function fetchCairnHealth(): Promise<{ ok: boolean; status: number }> {
  try {
    const response = await fetch(`${CAIRN_API_URL}/health`, { method: 'GET' })
    return { ok: response.ok, status: response.status }
  } catch {
    return { ok: false, status: 0 }
  }
}

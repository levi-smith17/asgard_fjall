import {
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser'
import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/browser'

async function postJson<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as { error?: string }
    throw new Error(payload.error ?? `Request failed (${response.status})`)
  }
  return (await response.json()) as T
}

export type GateUser = { sub: string; email: string }

export async function fetchAuthStatus(): Promise<{
  mode: string
  passkeysConfigured: boolean
  passkeys?: Array<{ id: string; deviceName: string | null; createdAt: string }>
}> {
  const response = await fetch('/api/auth/status', { credentials: 'include' })
  if (!response.ok) throw new Error('Failed to load auth status')
  return (await response.json()) as {
    mode: string
    passkeysConfigured: boolean
    passkeys?: Array<{ id: string; deviceName: string | null; createdAt: string }>
  }
}

export async function fetchGateMe(): Promise<GateUser | null> {
  const response = await fetch('/api/auth/me', { credentials: 'include' })
  if (response.status === 401) return null
  if (!response.ok) throw new Error('Failed to load session')
  return (await response.json()) as GateUser
}

export async function logoutGate(): Promise<void> {
  await postJson('/api/auth/logout')
}

export async function registerPasskey(deviceName?: string) {
  const { options, deviceName: resolvedName } = await postJson<{
    options: PublicKeyCredentialCreationOptionsJSON
    deviceName: string | null
  }>('/api/auth/webauthn/register/options', { deviceName })

  const response = await startRegistration({ optionsJSON: options })
  return postJson('/api/auth/webauthn/register/verify', {
    response,
    deviceName: deviceName ?? resolvedName,
  })
}

export async function loginWithPasskey() {
  const { options } = await postJson<{ options: PublicKeyCredentialRequestOptionsJSON }>(
    '/api/auth/webauthn/login/options',
  )
  const response: AuthenticationResponseJSON = await startAuthentication({ optionsJSON: options })
  return postJson('/api/auth/webauthn/login/verify', { response })
}

import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_VERSION = 'v1'
export const DEFAULT_SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000
export const SESSION_COOKIE_NAME = 'fjall_session'
export const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

export type SessionUser = { sub: string; email: string }

export type SessionConfig = {
  sessionSecret: string
  user: SessionUser
  rpId: string
  rpName: string
  /** Primary origin (cookie Secure flag + default). */
  origin: string
  /** All allowed WebAuthn origins (asgard + LAN fjall, etc.). */
  origins: string[]
}

function parseOrigins(env: NodeJS.ProcessEnv): string[] {
  const fromList = (env.FJALL_WEBAUTHN_ORIGINS ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean)
  const primary = env.FJALL_WEBAUTHN_ORIGIN?.trim()
  const merged = [...fromList]
  if (primary && !merged.includes(primary)) merged.unshift(primary)
  if (merged.length === 0) merged.push('https://asgard.levismith.us')
  return merged
}

/** Stable user id — Dynamo rows are keyed USER#<sub>. */
export const DEFAULT_DATA_USER_SUB = '610b75f0-6031-703c-a794-0924826eaa3f'

export function loadSessionConfig(env: NodeJS.ProcessEnv = process.env): SessionConfig {
  const sessionSecret = env.FJALL_SESSION_SECRET?.trim()
  const origins = parseOrigins(env)
  const origin = origins[0]
  const rpId = env.FJALL_WEBAUTHN_RP_ID?.trim() || 'levismith.us'
  const rpName = env.FJALL_WEBAUTHN_RP_NAME?.trim() || 'Asgard Fjall'
  const email = env.FJALL_AUTH_EMAIL?.trim() || 'admin@local'
  const sub = env.FJALL_AUTH_SUB?.trim() || DEFAULT_DATA_USER_SUB

  if (!sessionSecret) {
    throw new Error('FJALL_SESSION_SECRET is required')
  }

  return {
    sessionSecret,
    user: { sub, email },
    rpId,
    rpName,
    origin,
    origins,
  }
}

/** True when a Bearer looks like a Fjall session token (`v1.<payload>.<sig>`). */
export function isFjallSessionToken(token: string): boolean {
  return token.startsWith(`${SESSION_VERSION}.`)
}

export function createSessionToken(
  config: SessionConfig,
  payload: SessionUser,
  ttlMs = DEFAULT_SESSION_TTL_MS,
): string {
  const body = { ...payload, exp: Date.now() + ttlMs }
  const encoded = Buffer.from(JSON.stringify(body)).toString('base64url')
  const signature = createHmac('sha256', config.sessionSecret).update(encoded).digest('base64url')
  return `${SESSION_VERSION}.${encoded}.${signature}`
}

export function parseSessionToken(config: SessionConfig, token: string): SessionUser & { exp: number } {
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) {
    throw new Error('Invalid session token')
  }
  const [, encoded, signature] = parts
  const expected = createHmac('sha256', config.sessionSecret).update(encoded).digest('base64url')
  const actual = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
    throw new Error('Invalid session signature')
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as SessionUser & {
    exp: number
  }
  if (!payload.sub || !payload.email || !payload.exp || payload.exp <= Date.now()) {
    throw new Error('Session expired')
  }
  return payload
}

/** Host-only cookie — never set Domain=. */
export function formatSessionCookieHeader(token: string, secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_MAX_AGE_SECONDS}${secure ? '; Secure' : ''}`
}

export function clearSessionCookieHeader(secure: boolean): string {
  return `${SESSION_COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure ? '; Secure' : ''}`
}

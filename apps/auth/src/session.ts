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
  origin: string
}

export function loadSessionConfig(env: NodeJS.ProcessEnv = process.env): SessionConfig {
  const sessionSecret = env.FJALL_SESSION_SECRET?.trim()
  const origin = env.FJALL_WEBAUTHN_ORIGIN?.trim() || 'https://asgard.levismith.us'
  const rpId = env.FJALL_WEBAUTHN_RP_ID?.trim() || new URL(origin).hostname
  const rpName = env.FJALL_WEBAUTHN_RP_NAME?.trim() || 'Asgard Fjall'
  const email = env.FJALL_AUTH_EMAIL?.trim() || 'admin@local'

  if (!sessionSecret) {
    throw new Error('FJALL_SESSION_SECRET is required')
  }

  return {
    sessionSecret,
    user: { sub: 'fjall-user', email },
    rpId,
    rpName,
    origin,
  }
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

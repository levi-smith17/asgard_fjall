import { createHmac, timingSafeEqual } from 'node:crypto'

const SESSION_VERSION = 'v1'

export type FjallSessionUser = { sub: string; email: string; exp: number }

export function isFjallSessionToken(token: string): boolean {
  return token.startsWith(`${SESSION_VERSION}.`)
}

export function parseFjallSessionToken(sessionSecret: string, token: string): FjallSessionUser {
  const parts = token.split('.')
  if (parts.length !== 3 || parts[0] !== SESSION_VERSION) {
    throw new Error('Invalid session token')
  }
  const [, encoded, signature] = parts
  const expected = createHmac('sha256', sessionSecret).update(encoded).digest('base64url')
  const actual = Buffer.from(signature)
  const expectedBuf = Buffer.from(expected)
  if (actual.length !== expectedBuf.length || !timingSafeEqual(actual, expectedBuf)) {
    throw new Error('Invalid session signature')
  }
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as FjallSessionUser
  if (!payload.sub || !payload.email || !payload.exp || payload.exp <= Date.now()) {
    throw new Error('Session expired')
  }
  return payload
}

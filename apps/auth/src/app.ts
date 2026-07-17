import { Hono } from 'hono'
import type { AuthenticationResponseJSON, RegistrationResponseJSON } from '@simplewebauthn/server'
import {
  SESSION_COOKIE_NAME,
  clearSessionCookieHeader,
  createSessionToken,
  formatSessionCookieHeader,
  loadSessionConfig,
  parseSessionToken,
  type SessionConfig,
} from './session.js'
import { createStoreFromEnv } from './store.js'
import { createWebAuthnService } from './webauthn.js'

function webAuthnError(error: unknown): { error: string } {
  return { error: error instanceof Error ? error.message : 'Passkey request failed' }
}

function readSessionCookie(
  c: { req: { header: (name: string) => string | undefined } },
  config: SessionConfig,
): { user: ReturnType<typeof parseSessionToken>; token: string } | null {
  const cookieHeader = c.req.header('cookie') ?? ''
  const match = cookieHeader
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE_NAME}=`))
  const token = match?.slice(SESSION_COOKIE_NAME.length + 1)
  if (!token) return null
  try {
    return { user: parseSessionToken(config, token), token }
  } catch {
    return null
  }
}

function issueSession(
  c: { header: (name: string, value: string) => void },
  config: SessionConfig,
) {
  const token = createSessionToken(config, config.user)
  const secure = config.origin.startsWith('https://')
  c.header('Set-Cookie', formatSessionCookieHeader(token, secure))
  return token
}

export function createAuthApp(env: NodeJS.ProcessEnv = process.env) {
  const config = loadSessionConfig(env)
  const store = createStoreFromEnv(env)
  const webauthn = createWebAuthnService(config, store)
  const app = new Hono()

  // Public: never list passkey metadata here — manage via RealmOps.
  app.get('/api/auth/status', async (c) => {
    return c.json({
      mode: 'passkey',
      passkeysConfigured: await webauthn.hasPasskeys(),
    })
  })

  app.get('/api/auth/me', async (c) => {
    const session = readSessionCookie(c, config)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({ sub: session.user.sub, email: session.user.email })
  })

  /** Mint/reuse Bearer for api.asgard (HttpOnly cookie alone cannot be read by JS). */
  app.get('/api/auth/access-token', async (c) => {
    const session = readSessionCookie(c, config)
    if (!session) return c.json({ error: 'Unauthorized' }, 401)
    return c.json({
      accessToken: session.token,
      sub: session.user.sub,
      email: session.user.email,
    })
  })

  app.post('/api/auth/logout', async (c) => {
    const secure = config.origin.startsWith('https://')
    c.header('Set-Cookie', clearSessionCookieHeader(secure))
    return c.json({ success: true })
  })

  app.post('/api/auth/webauthn/register/options', async (c) => {
    try {
      // Open registration only for bootstrap (zero passkeys). After that, session required.
      if (await webauthn.hasPasskeys()) {
        const session = readSessionCookie(c, config)
        if (!session) return c.json({ error: 'Authentication required' }, 401)
      }
      const body = (await c.req.json().catch(() => ({}))) as { deviceName?: string }
      const { options, deviceName } = await webauthn.registrationOptions(body.deviceName)
      return c.json({ options, deviceName })
    } catch (error) {
      return c.json(webAuthnError(error), 400)
    }
  })

  app.post('/api/auth/webauthn/register/verify', async (c) => {
    try {
      if (await webauthn.hasPasskeys()) {
        const session = readSessionCookie(c, config)
        if (!session) return c.json({ error: 'Authentication required' }, 401)
      }
      const body = (await c.req.json()) as {
        response?: RegistrationResponseJSON
        deviceName?: string | null
      }
      if (!body.response) return c.json({ error: 'Registration response is required' }, 400)
      await webauthn.verifyRegistration(body.response, body.deviceName ?? null)
      const accessToken = issueSession(c, config)
      return c.json({ ...config.user, verified: true, accessToken })
    } catch (error) {
      return c.json(webAuthnError(error), 400)
    }
  })

  app.post('/api/auth/webauthn/login/options', async (c) => {
    try {
      if (!(await webauthn.hasPasskeys())) {
        return c.json({ error: 'Register a passkey first' }, 400)
      }
      const options = await webauthn.authenticationOptions()
      return c.json({ options })
    } catch (error) {
      return c.json(webAuthnError(error), 400)
    }
  })

  app.post('/api/auth/webauthn/login/verify', async (c) => {
    try {
      const body = (await c.req.json()) as { response?: AuthenticationResponseJSON }
      if (!body.response) return c.json({ error: 'Authentication response is required' }, 400)
      await webauthn.verifyAuthentication(body.response)
      const accessToken = issueSession(c, config)
      return c.json({ ...config.user, accessToken })
    } catch (error) {
      return c.json(webAuthnError(error), 400)
    }
  })

  return app
}

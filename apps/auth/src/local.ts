import { serve } from '@hono/node-server'
import { createAuthApp } from './app.js'

if (!process.env.FJALL_SESSION_SECRET) {
  process.env.FJALL_SESSION_SECRET = 'fjall-dev-session-secret-change-me'
}
if (!process.env.FJALL_WEBAUTHN_ORIGIN) {
  process.env.FJALL_WEBAUTHN_ORIGIN = 'http://localhost:5180'
}
if (!process.env.FJALL_WEBAUTHN_RP_ID) {
  process.env.FJALL_WEBAUTHN_RP_ID = 'localhost'
}

const port = Number(process.env.PORT ?? 3002)
const app = createAuthApp()

serve({ fetch: app.fetch, port }, () => {
  console.log(`Fjall auth listening on http://localhost:${port}`)
})

# Fjall API auth

Fjall uses **passkeys** (`fjall_session` cookie) plus **API tokens** (`csk_*`) for RealmOps — not Cognito.

## Browser (web app)

1. User signs in with a passkey via `apps/auth` (CloudFront `/api/auth*`).
2. The auth Lambda mints an HttpOnly `fjall_session` cookie and a short-lived Bearer token (`v1.*`).
3. The web app stores the Bearer in memory/localStorage and sends it on data API calls via `fjallFetch`.
4. Legacy Summit client paths (e.g. `/waypoints`, `/burn`) are remapped to Asgard routes at the fetch boundary (`mapFjallApiPathToAsgard`).

Do **not** embed private API tokens in the static bundle.

## API authorizer

Protected routes accept:

| Token | Prefix | Auth type |
|-------|--------|-----------|
| Passkey session Bearer | `v1.` | `fjall_session` |
| RealmOps API token | `csk_` | `api_token` |

Both are verified in `apps/api/functions/auth/authorizer/handler.ts`.

## CORS

Ensure `api.asgard.levismith.us` allows Fjall web origins (`asgard.levismith.us`, `fjall.levismith.us`, localhost dev).

## Env vars

**Web (Vite):**

```bash
VITE_FJALL_API_URL=https://api.asgard.levismith.us
VITE_WEBAUTHN_RP_ID=levismith.us
VITE_SESSION_COOKIE_NAME=fjall_session
```

**API (Terraform / Lambda):**

```bash
FJALL_SESSION_SECRET=...   # SSM /asgard-fjall/<env>/FJALL_SESSION_SECRET
```

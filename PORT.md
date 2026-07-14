# Asgard Fjall — Port Status

## Launch gate
- **Auth gate:** Passkeys + HttpOnly `fjall_session` via `apps/auth` (DynamoDB + Lambda Function URL, CloudFront `/api/auth*`).
- **Cairn API:** Cognito ID token as Bearer via `cairnFetch` (separate from passkey gate).
- **Public URL:** `https://asgard.levismith.us`
- **Local:** `pnpm dev:auth` (port 3002) + Vite proxies `/api/auth`

## Shipped (day-1)
| App | Route | Notes |
|-----|-------|-------|
| Basecamp | `/` | Summit-style home + snapshots + Stjornur entry |
| Sendibod | `/sendibod` | Signals list/detail, search, status |
| Audr | `/audr` | Burns / supplylines / cache / Skatt |
| Dagatal | `/dagatal` | Cairn itinerary calendar |
| Ordstirr | `/ordstirr` | Manifest / résumé |
| Sögur | `/sogur` | Logbook / notes |
| Stjörnur | `/stjornur` | Full `@xyflow/react` planner canvas |

## Foundation
- Studio layout + UI primitives, inspector pin (no BFF cache-sync)
- Expanded terminology / `useTerms` with cycle chrome
- Cognito defaults baked in `config.ts` (overridable via `VITE_*`)
- Asgard-parity shell: narrow icon rail, tree brand + **Fjall** subtitle, overflow-hidden main + Valknut watermark
- Dual palettes (`green` default + `fjall` gold) with light/dark theme
- Command palette (⌘/Ctrl+K) + context-bar search triggers (Fjall routes + sign-in/out)
- Public Ordstirr rail + companion media parity with RealmOps

## Deferred
- Wire CI to zip/publish `apps/auth` Lambda on each deploy (Terraform creates placeholder; `lifecycle.ignore_changes` on package)
- Greinar / Basecamp empty-state copy cleanup as auth evolves
- Chunk-size warning on production bundle (~2.5MB JS)

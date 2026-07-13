# Asgard Fjall — Port Status

## Launch gate
- **Auth:** Cognito (pool `us-east-2_lf42INJJ7`, client `4sqhce1qj85imq4sk8i9dei36d`). Passkeys deferred.
- **API:** Direct to `https://api.cairn.ing` via `cairnFetch` (unwraps `{ data }`).
- **Public URL:** `https://asgard.levismith.us`

## Shipped (day-1)
| App | Route | Notes |
|-----|-------|-------|
| Basecamp | `/` | Summit-style home + snapshots + Stjornur entry |
| Sendibod | `/sendibod` | Signals list/detail, search, status |
| Audr | `/audr` | Burns / supplylines / cache / Skatt |
| Dagatal | `/dagatal` | Cairn itinerary calendar |
| Ordstirr | `/ordstirr` | Manifest / résumé |
| Sögur | `/sogur` | Logbook / notes |
| Stjörnur | `/stjornur` | Redirects to Basecamp until reactflow port |

## Foundation
- Studio layout + UI primitives, inspector pin (no BFF cache-sync)
- Expanded terminology / `useTerms` with cycle chrome
- Cognito defaults baked in `config.ts` (overridable via `VITE_*`)
- Asgard-parity shell: narrow icon rail, tree brand + **Fjall** subtitle, overflow-hidden main + Valknut watermark
- Dual palettes (`green` default + `fjall` gold) with light/dark theme
- Command palette (⌘/Ctrl+K) + context-bar search triggers (Fjall routes + sign-in/out)

## Deferred
- Stjörnur full canvas (`@xyflow/react`)
- Passkey gate
- Full Basecamp snapshot polish (parity with private Asgard Summit)
- Chunk-size warning on production bundle (~2.5MB JS)

# Asgard Fjall — Port Status

## Completed (this session)

### Phase 0 — Foundation
- `cairn-client.ts` — unwraps `{ data: T }` BFF envelopes; talks directly to Cairn API
- `cairn-api.ts` — Sendibod endpoints (signals CRUD, status, full settings)
- Studio UI primitives: `button`, `input`, `tooltip`, `toolbar-tooltip`, `confirm-dialog`, `studio-skeletons`
- Studio layout: `studio-layout`, `studio-context-bar`, `studio-data-toolbar`, `studio-mobile-rail-context`, `studio-rail-toggle`, `inspector-hint-rail`, `context-bar-search`
- Helper: `context-bar-inspector-pin`, `context-bar-pin-and-sync` (pin only; no BFF cache-sync)
- `inspector-pinned.ts` + `use-inspector-pinned` hook
- `use-media-query` hook
- `terminology.ts` expanded (added `notesSingular`, `laufar*`, `greinar*`, `runir*`)
- `use-terminology.ts` — added `useTerms()` alias
- `index.css` — full Tailwind v4 `@theme inline` token set (card, muted-hover, primary-foreground, destructive, context-bar, column-rail, column-inspector, ring, input, …)
- `cognito.ts` — now pulls `COGNITO_USER_POOL_ID` / `COGNITO_CLIENT_ID` from `config.ts` (defaults baked in)
- `sonner` Toaster added to `main.tsx`
- `cairn-not-configured.tsx` — Fjall-adapted (no BFF ApiError dependency)

### Phase 1 — Sendibod
- `routes/sendibod.tsx` — full `SendibodPage` (status-gated, signals list + detail, search, delete, auto-mark-read, inspector pin)
- `components/cairn/sendibod/sendibod-context-bar.tsx`
- `components/cairn/sendibod/sendibod-filter-bar.tsx`
- `components/cairn/sendibod/sendibod-signal-list.tsx`
- `components/cairn/sendibod/sendibod-signal-detail.tsx`
- `App.tsx` — `/sendibod` wired to `SendibodPage`

## Remaining Apps (not started)

### Audr (Provisions / Finance)
- Source: `apps/web/src/routes/audr.tsx` + `components/cairn/audr/*`
- Needs: `cairn-api.ts` additions (burn, supplylines, cache, provisions-summary)
- Needs: `audr-format.ts` (date helpers), `CairnBurn`, `CairnSupplyline`, `CairnBurnPage` type defs

### Dagatal (Calendar / Itinerary)
- Source: `apps/web/src/routes/dagatal.tsx` + `components/cairn/dagatal/*`
- Needs: itinerary events API, calendar settings (iCloud + subscriptions), dagatal-events parser

### Ordstirr (Résumé / Manifest)
- Source: `apps/web/src/routes/ordstirr.tsx` + `components/cairn/ordstirr/*`
- Large surface — rich text editor, manifest sections, gear chart, journey canvas

### Sögur (Notes / Logbook)
- Source: `apps/web/src/routes/sogur.tsx` + `components/cairn/sogur/*`
- Needs: logs API, rich text context, sogur-format

### Stjörnur (Starfield / Night Sky)
- Source: `apps/web/src/routes/stjornur.tsx` + `components/cairn/stjornur/*`
- Needs: @xyflow/react, network/resource API, starfield canvas

## Notes
- `GlobalSearchTrigger` is a no-op stub in Fjall (command palette not ported yet)
- Cache sync button omitted from context bar — Fjall calls Cairn API directly (no BFF catalog cache)
- Receipt upload (`uploadCairnBurnReceipt`) requires a server-side proxy in Asgard BFF; Fjall will need to call the Cairn pre-signed URL endpoint directly when Audr is ported

# Asgard Fjall

> *In Norse myth, a fjall is a mountain — a high place open to the sky. This is the public face of Asgard: the same hall, without the locked armory of the homelab.*

**Asgard Fjall** is the public, personal Asgard-skinned client. It exposes personal productivity apps (journal, profile, provisions, planner, and related surfaces) behind an Asgard shell — and intentionally excludes the private homelab control plane (**RealmOps**).

Private companion: [`levi-smith17/asgard`](https://github.com/levi-smith17/asgard) (RealmOps). Product boundary brief lives there as `docs/asgard-fjall.md`.

---

## What Fjall Does

Fjall gathers personal apps into one cohesive interface with Asgard branding and terminology — without DNS, DHCP, firewall, Pi-hole, Kubernetes, NAS, VMs, or other RealmOps services.

| Surface | Role |
|---|---|
| Basecamp / **Hlidskjalf** | Home — Summit-style cards, snapshots, Stjörnur entry, Laufar rail |
| Finance / **Audr** | Expenses, subscriptions, budgets |
| Calendar / **Dagatal** | Itinerary calendar |
| Resume / **Ordstirr** | Public profile editor + live public views |
| Notes / **Sögur** | First-class Sagas, ordered Thaettir, standalone notes, and a Notion-like block editor |
| Starfield / **Stjörnur** | Outpost network planner |
| Messages / **Sendibod** | Contact-form signals |
| Settings / **Thing** | Account, privacy, itinerary preferences |
| **Völundr** | External Lattic Forge link |

**Out of scope forever:** Heimdall, Urdarbrunnr, The Norns, Jörmungandr, Mimir, Valhalla, Gladsheim, Ratatoskr, Vör, Huginn, Gjallarhorn, Skidbladnir, credentials/alerts cache Thing sections, Spjold board ops. (Skidbladnir’s Fjall deploy tab lives only on private Asgard.)

A sidebar toggle cycles UI labels (**Standard** ↔ **Asgard** by default on Fjall). Routes stay the same; only labels change. Preference is stored in `localStorage` under `fjall_terminology_style`.

---

## Tech Stack

### Frontend
- **[Vite](https://vitejs.dev/)** + **[React 19](https://react.dev/)** — single-page application
- **[React Router v7](https://reactrouter.com/)** — client-side routing
- **[TanStack Query](https://tanstack.com/query)** — data fetching and cache management
- **[Tailwind CSS v4](https://tailwindcss.com/)** — styling, shared studio two-tier layout with RealmOps
- **[Tiptap](https://tiptap.dev/)** + **dnd-kit** — Notion-like rich documents, slash commands, block drag-and-drop, and Saga ordering

### Data & auth
- **Fjall API** (`api.asgard.levismith.us`) — browser calls the API directly with passkey session Bearer (no RealmOps BFF / SSM token in the static site)
- **Passkeys** — app gate with host-only cookie `fjall_session` (see Auth Model)
- **API tokens** (`csk_*`) — RealmOps / automation only

### Infrastructure
- **Terraform** → static web, passkey auth, S3, CloudFront, ACM, and Route53 (`infrastructure/terraform/prod`)
- **Terragrunt** → Fjall API data, media, HTTP API Gateway, Lambda functions, and custom domains (`infrastructure/terragrunt/prod`)
- **GitHub Actions** — build/deploy web and update existing Lambda code on `main`
- **[Turborepo](https://turbo.build/)** + **[pnpm](https://pnpm.io/)** — workspace tooling

---

## Repository Structure

```
asgard_fjall/
├── apps/
│   ├── web/                 # Vite + React 19 frontend
│   ├── api/                 # Fjall HTTP API Lambda handlers
│   └── auth/                # Passkey registration/session service
├── infrastructure/
│   ├── terraform/prod/      # Static web, passkey auth, CloudFront, DNS
│   └── terragrunt/prod/     # API data, media, HTTP/Lambda, deploy IAM
├── docs/                    # Architecture, auth, and cutover notes
└── PORT.md                  # Porting / launch checklist (may lag README)
```

---

## Terminology

Source of truth: `apps/web/src/lib/terminology.ts`. Sidebar subtitle is **Fjall**.

### Legacy Summit labels

| Key | Standard | Legacy Summit | Asgard |
|---|---|---|---|
| Finance | Finance | Provisions | Audr |
| Calendar | Calendar | Itinerary | Dagatal |
| Messages | Messages | Signals | Sendibod |
| Resume / profile | Resume | Manifest | Ordstirr |
| Notes | Notebooks / Notebook | Logbook / Log | Sögur / Saga |
| Note pages | Notes / Note | Pages / Page | Thaettir / Thattr |
| Starfield | Starfield | Night Sky | Stjörnur |

### Ordstirr / profile sections (Asgard names)

Rót, Leidangr, Thjalfun, Bunadr, Vördur, Tindar, Lidsinni, Sjalfsmynd, Foruneyti, Bautasteinn, Ferd Min — with Standard résumé labels and legacy Summit labels in their respective modes.

### Basecamp catalog

| Key | Standard | Legacy Summit | Asgard |
|---|---|---|---|
| Tasks | Tasks | Waypoints | Laufar |
| Groups | Groups | Trails | Greinar |
| Tags | Tags | Markers | Rúnir |

### Sögur data model

- A **Saga** is a first-class container with its own name, Grein, Rúnir, and ordered list of Thaettir.
- A **Thattr** can belong to a Saga or remain standalone. A Saga-owned Thattr inherits its Saga's Grein while retaining its own content, Rúnir, and optional Lauf.
- The editor stores ordinary Tiptap HTML and presents a transparent, Notion-like canvas with slash commands, H1–H3, lists, quotes, code, dividers, images, contextual formatting, and block drag-and-drop.
- Older records grouped only by `trailId` are synthesized into legacy Sagas client-side and materialized as real `SAGA#` records when edited or reordered.
- Saga deletion detaches its Thaettir instead of deleting them.

The API exposes `GET/POST /sogur/sagas`, `PUT/DELETE /sogur/sagas/{id}`, and `PUT /sogur/sagas/{id}/reorder`, alongside the existing `/sogur` Thattr routes.

---

## Auth Model

- **App gate:** passkeys via `apps/auth` — host-only HttpOnly cookie `fjall_session` (no `Domain=`). Distinct from private Asgard’s `asgard_session`.
- **Data API:** passkey session Bearer via `fjallFetch`. Do **not** embed private API tokens in the static site.
- **Infra:** DynamoDB credentials/challenges + Lambda Function URL; CloudFront routes `/api/auth*` to that origin.
- **Local:** `pnpm dev:auth` (port 3002); web Vite proxies `/api/auth`. Set `FJALL_SESSION_SECRET` in Terraform/SSM for prod.

See `docs/fjall-api-auth.md`.

---

## Relation to legacy Summit API

- Browser → `https://api.asgard.levismith.us` (passkey session Bearer; legacy client paths remapped to Asgard routes)
- Media → `https://media.asgard.levismith.us`
- Public Ordstirr paths on Fjall use Asgard-style URLs (`/ordstirr/:username`, `/ferd`, `/ordsending`); custom domains may still host `/manifest/…`

---

## Develop

```bash
pnpm install
pnpm dev
```

Web defaults to the Vite dev server (typically `http://localhost:5173`). Overlay API / auth values with `VITE_*` env vars as needed — never commit secrets.

---

## Deploy

### Web and passkey infrastructure

One-time or infrastructure changes:

```bash
cd infrastructure/terraform/prod
AWS_PROFILE=asgard terraform apply -var-file=prod.tfvars
```

Pushing to `main` builds the web app, syncs it to S3, and invalidates CloudFront.

### Fjall API infrastructure and code

The cloud API is managed by Terragrunt. In particular, new routes or Lambda functions must be applied from `api-http` **before** the code deploy runs:

```bash
cd infrastructure/terragrunt/prod/api-http
AWS_PROFILE=asgard terragrunt apply

cd ../../../..
AWS_PROFILE=asgard pnpm --filter @asgard-fjall/api deploy:sogur
```

`deploy:all` and feature deploy scripts update Lambda code; they do not create missing functions, IAM roles, or API Gateway routes. See `infrastructure/terragrunt/README.md` for all API stacks.

| Environment | Domain |
|---|---|
| Production | [asgard.levismith.us](https://asgard.levismith.us) |

Skidbladnir on private Asgard watches the Fjall repo for release visibility.

---

## Project Status

Fjall is actively maintained as the public twin of Asgard RealmOps. It is a personal project and not open for contributions at this time. Explore the codebase or reach out via [levismith.us](https://levismith.us).

---

*Built by [Levi Smith](https://levismith.us) with [Cursor](https://cursor.com)*

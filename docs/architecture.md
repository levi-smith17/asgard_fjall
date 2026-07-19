# Asgard Fjall — architecture

Repo: `levi-smith17/asgard_fjall`

## Locked decisions

| Area | Choice |
|------|--------|
| URL | Public `asgard.levismith.us` → Fjall CloudFront (Terraform) |
| LAN Fjall | Pi-hole `fjall.levismith.us` → same CloudFront (no public DNS) |
| LAN Shortcuts | Pi-hole `asgard.levismith.us` → private Asgard |
| Backdoor | `ops.asgard.levismith.us` |
| Apex | `levismith.us` / `www` → public Ordstirr (Standard terms) |
| API (Phase C) | Lambda + HTTP API Gateway via Terragrunt → `api.asgard.levismith.us` |
| Media (Phase C) | `media.asgard.levismith.us` (public companions via CloudFront OAC) |
| API data | Clients → `api.asgard.levismith.us` (path remaps at fetch boundary) |
| Gate auth | Passkeys; `fjall_session`; RP ID `levismith.us` (shared across `asgard` + `fjall` hosts) |
| Data API auth | Passkey session Bearer (`v1.*`) or RealmOps API token (`csk_*`) |
| CI | `main` only; separate Fjall Web vs Fjall API workflows (`deploy-web.yml` / `deploy-api.yml`) |

## API CORS

Ensure Fjall web origins are in API Gateway `allowed_origins` and S3 media `allowed_origins`.

## Cookies

Never set `Domain=asgard.levismith.us`. Host-only `fjall_session` only.

See `docs/fjall-api-auth.md`.

# Asgard Fjall — architecture

Repo: `levi-smith17/asgard_fjall`

## Locked decisions

| Area | Choice |
|------|--------|
| URL | Public `asgard.levismith.us` → Fjall CloudFront (Terraform) |
| LAN Fjall | Pi-hole `fjall.levismith.us` → same CloudFront (no public DNS) |
| LAN Shortcuts | Pi-hole `asgard.levismith.us` → private Asgard |
| Backdoor | `ops.asgard.levismith.us` |
| API data | Cairn only (`VITE_CAIRN_API_URL`) |
| Gate auth | Passkeys; `fjall_session`; RP ID `levismith.us` (shared across `asgard` + `fjall` hosts) |
| Cairn auth | Cognito bearer in browser (preferred) **or** thin BFF later |
| CI | `main` only |

## Cairn CORS / auth (owner: cairn-summit Terraform)

Add `https://asgard.levismith.us` to:

- API Gateway `allowed_origins`
- S3 media `allowed_origins`

And configure Cognito callbacks for that origin (unless using a BFF with the server API token).

## Cookies

Never set `Domain=asgard.levismith.us`. Host-only `fjall_session` only.

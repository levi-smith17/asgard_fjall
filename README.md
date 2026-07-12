# Asgard Fjall

Public personal Asgard-skinned client at `asgard.levismith.us`.

- **Data:** Cairn API (`api.cairn.ing`) — no RealmOps.
- **Auth:** Passkeys, single-user, cookie `fjall_session` (host-only).
- **Apps:** Audr, Dagatal (Itinerary), Ordstirr, Sogur, Stjornur, Sendibod.
- **Home:** Basecamp — Summit cards + Asgard snapshots + Stjornur.
- **Brand:** Asgard terms by default; sidebar subtitle **Fjall**.
- **Infra:** Terraform → S3 + CloudFront + Route53 alias (see `infrastructure/terraform/prod`).

Canonical product brief (private Asgard): `docs/asgard-fjall.md` in `levi-smith17/asgard`.

## Develop

```bash
pnpm install
pnpm dev
```

## Deploy

1. `terraform apply` in `infrastructure/terraform/prod`
2. Push to `main` — GitHub Actions builds and syncs to S3 / invalidates CloudFront

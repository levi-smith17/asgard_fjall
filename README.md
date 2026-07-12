# Asgard Fjall

Public personal Asgard-skinned client at `asgard.levismith.us`.

- **Data:** Cairn API only (no Fjall backend, no RealmOps).
- **Auth:** Passkeys, single-user, separate session cookie from private Asgard.
- **Apps:** Audr, Dagatal (Cairn Itinerary), Ordstirr, Sogur, Stjornur, Sendibod.
- **Home:** Basecamp — Summit-style cards + Asgard snapshot row + Stjornur; no Spjold.
- **Brand:** Asgard terms by default; sidebar subtitle **Fjall**.

Architecture & your infra checklist (DNS, TLS, CORS) live in the private Asgard repo:

[`asgard/docs/asgard-fjall.md`](https://github.com/levi-smith17/asgard/blob/main/docs/asgard-fjall.md)

## Develop

```bash
pnpm install
pnpm dev
```

## Deploy

Single branch: `main`. Skidbladnir → **Fjall** on private Asgard watches `.github/workflows/ci.yml`.

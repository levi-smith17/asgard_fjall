# Asgard Fjall — short architecture

See the canonical brief in private Asgard: `docs/asgard-fjall.md`.

## Locked decisions

| Area | Choice |
|------|--------|
| URL | Public `asgard.levismith.us` → Fjall; LAN DNS → private Asgard |
| Backdoor | `ops.asgard.levismith.us` (local A only, LE DNS-01, never public A) |
| API | Cairn only |
| Auth | Passkeys; `fjall_session`; RP ID `asgard.levismith.us` (shared with private, workable) |
| Calendar | Cairn Itinerary |
| CI | `main` only; observed from private Asgard Skidbladnir |
| Out | All RealmOps surfaces |

## App shell

- Product subtitle: **Fjall**
- Term toggle (Asgard / Cairn / Standard) like private Asgard
- Studio layout patterns (rail / context bar / canvas / mobile)

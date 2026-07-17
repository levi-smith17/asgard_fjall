# Dynamo cutover (Phase D)

Copy `cairn-prod` → `asgard-fjall-prod` with Asgard SK remaps and `Provisions` → `Audr`.
Source table is never modified. Default is dry-run.

```bash
# Dry-run (counts + sample remaps)
python3 scripts/migrate-dynamo.py

# Apply table copy + SSM CalDAV passwords
python3 scripts/migrate-dynamo.py --apply --copy-ssm
```

Profiles/tables (env overrides):

| Env | Default |
|-----|---------|
| `SOURCE_PROFILE` | `cairn-prod` |
| `SOURCE_TABLE` | `cairn-prod` |
| `TARGET_PROFILE` | `asgard` |
| `TARGET_TABLE` | `asgard-fjall-prod` |
| `AWS_REGION` | `us-east-2` |

### Remaps

| Cairn SK | Asgard SK |
|----------|-----------|
| `WAYPOINT#` | `LAUF#` |
| `TRAIL#` | `GREIN#` |
| `MARKER#` | `RUN#` |
| `BURN#` / legacy `EXPENSE#` | `SURTR#` |
| `SUPPLYLINE#` | `IDUNN#` |
| `CACHE#` | `SKATT#` |
| `LOG#` | `SOGUR#` |
| `SIGNAL#` | `SENDIBOD#` |
| `ITINERARY#` | `DAGATAL#` |
| `ITINERARY_SUB#` | `DAGATAL_SUB#` |
| `FUND#` | `SJODR#` |

Also rewrites string fields `Provisions` / `Provisions/…` → `Audr` / `Audr/…` (including embedded `markers[].name`), and `ssmPasswordPath` from `/cairn/users/…/itinerary/…` → `/asgard-fjall/users/…/dagatal/…`.

### Skipped

- `STONE#` / `GUIDE#` / `STOP#` (Guides / Outpost — out of scope)
- `BUDGET#`, `PROVISION#`, `CAL_SUB#` (legacy duplicates of `CACHE#` / `SUPPLYLINE#` / `ITINERARY_SUB#`)

### After apply

1. Sync media: `bash scripts/sync-media.sh`
2. Point clients at `https://api.asgard.levismith.us` / `https://media.asgard.levismith.us` (path remaps in web `map-api-path` + RealmOps BFF).
3. Passkey re-enroll on Fjall if user ids change.

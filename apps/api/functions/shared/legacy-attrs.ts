/**
 * Dual-read helpers for the English→Norse attribute rename.
 * Prefer the Norse name; fall back to the legacy English name until
 * `scripts/migrate-domain-attrs.py` has rewritten stored items.
 */

export function readGreinId(item: Record<string, unknown>): string | null {
  const value = item.greinId ?? item.trailId
  return value != null ? String(value) : null
}

export function readLaufId(item: Record<string, unknown>): string | null {
  const value = item.laufId ?? item.waypointId
  return value != null ? String(value) : null
}

export function readRunId(item: Record<string, unknown>): string | null {
  const value = item.runId ?? item.markerId
  return value != null ? String(value) : null
}

export function readEmbeddedRunir<T>(item: Record<string, unknown>): T[] {
  const value = item.runir ?? item.markers
  return Array.isArray(value) ? (value as T[]) : []
}

/**
 * Project dual-read fields onto the canonical Norse attribute names so API
 * clients always see `greinId` / `laufId` / `runir` even before Dynamo migrate.
 */
export function withCanonicalDomainAttrs<T extends Record<string, unknown>>(
  item: T,
): T & { greinId?: string; laufId?: string; runId?: string; runir: unknown[] } {
  const greinId = readGreinId(item)
  const laufId = readLaufId(item)
  const runId = readRunId(item)
  return {
    ...item,
    ...(greinId != null ? { greinId } : {}),
    ...(laufId != null ? { laufId } : {}),
    ...(runId != null ? { runId } : {}),
    runir: readEmbeddedRunir(item),
  }
}

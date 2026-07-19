/**
 * Canonical domain attribute readers (post migrate-domain-attrs.py).
 */

export function readGreinId(item: Record<string, unknown>): string | null {
  return item.greinId != null ? String(item.greinId) : null
}

export function readLaufId(item: Record<string, unknown>): string | null {
  return item.laufId != null ? String(item.laufId) : null
}

export function readRunId(item: Record<string, unknown>): string | null {
  return item.runId != null ? String(item.runId) : null
}

export function readEmbeddedRunir<T>(item: Record<string, unknown>): T[] {
  return Array.isArray(item.runir) ? (item.runir as T[]) : []
}

/** Ensure list responses always expose a `runir` array (empty when unset). */
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

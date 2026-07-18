export interface DisplayRun {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type LiveRunLookup = ReadonlyMap<
  string,
  Pick<DisplayRun, 'name' | 'color' | 'icon'>
>

/** Build an id → live Run map for overlaying embedded snapshots. */
export function liveRunirById(
  runir: Iterable<{ id: string; name: string; color: string; icon?: string | null }>,
): Map<string, DisplayRun> {
  const map = new Map<string, DisplayRun>()
  for (const run of runir) {
    map.set(run.id, {
      id: run.id,
      name: run.name,
      color: run.color,
      icon: run.icon ?? null,
    })
  }
  return map
}

/**
 * Prefer the live Run catalog over the denormalized EmbeddedRun snapshot
 * (color/name/icon at last save). Embedded copies go stale when a Run changes.
 */
export function withLiveRun(
  run: DisplayRun,
  liveById?: LiveRunLookup,
): DisplayRun {
  const live = liveById?.get(run.id)
  if (!live) return run
  return {
    id: run.id,
    name: live.name || run.name,
    color: live.color || run.color,
    icon: live.icon !== undefined ? live.icon : run.icon,
  }
}

/** DynamoDB EmbeddedRun or legacy Prisma junction `{ runId, run }` */
export function toDisplayRun(
  entry: unknown,
  liveById?: LiveRunLookup,
): DisplayRun | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  let base: DisplayRun | null = null
  if (e.run && typeof e.run === 'object') {
    const m = e.run as DisplayRun
    base = typeof m.id === 'string' ? m : null
  } else if (
    typeof e.id === 'string' &&
    typeof e.name === 'string' &&
    typeof e.color === 'string'
  ) {
    base = {
      id: e.id,
      name: e.name,
      color: e.color,
      icon: e.icon as string | null | undefined,
    }
  }
  return base ? withLiveRun(base, liveById) : null
}

export function toRunId(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  if (typeof e.runId === 'string') return e.runId
  return toDisplayRun(entry)?.id ?? null
}

export function runDisplayName(
  entry: unknown,
  liveById?: LiveRunLookup,
): string | null {
  return toDisplayRun(entry, liveById)?.name ?? null
}

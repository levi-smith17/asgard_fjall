export interface DisplayMarker {
  id: string
  name: string
  color: string
  icon?: string | null
}

export type LiveMarkerLookup = ReadonlyMap<
  string,
  Pick<DisplayMarker, 'name' | 'color' | 'icon'>
>

/** Build an id → live Run map for overlaying embedded snapshots. */
export function liveMarkersById(
  markers: Iterable<{ id: string; name: string; color: string; icon?: string | null }>,
): Map<string, DisplayMarker> {
  const map = new Map<string, DisplayMarker>()
  for (const marker of markers) {
    map.set(marker.id, {
      id: marker.id,
      name: marker.name,
      color: marker.color,
      icon: marker.icon ?? null,
    })
  }
  return map
}

/**
 * Prefer the live Run catalog over the denormalized EmbeddedMarker snapshot
 * (color/name/icon at last save). Embedded copies go stale when a Run changes.
 */
export function withLiveMarker(
  marker: DisplayMarker,
  liveById?: LiveMarkerLookup,
): DisplayMarker {
  const live = liveById?.get(marker.id)
  if (!live) return marker
  return {
    id: marker.id,
    name: live.name || marker.name,
    color: live.color || marker.color,
    icon: live.icon !== undefined ? live.icon : marker.icon,
  }
}

/** DynamoDB EmbeddedMarker or legacy Prisma junction `{ markerId, marker }` */
export function toDisplayMarker(
  entry: unknown,
  liveById?: LiveMarkerLookup,
): DisplayMarker | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  let base: DisplayMarker | null = null
  if (e.marker && typeof e.marker === 'object') {
    const m = e.marker as DisplayMarker
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
  return base ? withLiveMarker(base, liveById) : null
}

export function toMarkerId(entry: unknown): string | null {
  if (!entry || typeof entry !== 'object') return null
  const e = entry as Record<string, unknown>
  if (typeof e.markerId === 'string') return e.markerId
  return toDisplayMarker(entry)?.id ?? null
}

export function markerDisplayName(
  entry: unknown,
  liveById?: LiveMarkerLookup,
): string | null {
  return toDisplayMarker(entry, liveById)?.name ?? null
}

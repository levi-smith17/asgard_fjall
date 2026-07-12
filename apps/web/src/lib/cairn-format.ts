import type { CairnMarker, CairnMarkerView, CairnTrail, CairnTrailView, CairnWaypoint, CairnWaypointView } from '@/lib/cairn-types'

export function extractCairnId(sk: string): string {
  const hash = sk.lastIndexOf('#')
  return hash >= 0 ? sk.slice(hash + 1) : sk
}

export function secureRemoteAssetUrl(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url
}

export function toTrailView(trail: CairnTrail): CairnTrailView {
  return {
    id: extractCairnId(trail.sk),
    name: trail.name,
    createdAt: trail.createdAt,
  }
}

export function toMarkerView(marker: CairnMarker): CairnMarkerView {
  return {
    id: extractCairnId(marker.sk),
    name: marker.name,
    color: marker.color,
    icon: marker.icon ?? null,
    createdAt: marker.createdAt,
    waypointCount: marker.waypointCount ?? 0,
  }
}

export function toWaypointView(
  waypoint: CairnWaypoint,
  trailsById: Map<string, CairnTrailView>,
): CairnWaypointView {
  const trailId = waypoint.trailId ?? null
  return {
    id: extractCairnId(waypoint.sk),
    url: waypoint.url,
    title: waypoint.title,
    description: waypoint.description ?? '',
    favicon: waypoint.favicon ?? '',
    notes: waypoint.notes ?? '',
    read: waypoint.read,
    readLater: waypoint.readLater,
    trailId,
    trailName: trailId ? trailsById.get(trailId)?.name ?? null : null,
    markers: waypoint.markers ?? [],
    createdAt: waypoint.createdAt,
  }
}

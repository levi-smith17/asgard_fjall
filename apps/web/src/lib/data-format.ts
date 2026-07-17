import type { FjallMarker, FjallMarkerView, FjallTrail, FjallTrailView, FjallWaypoint, FjallWaypointView } from '@/lib/data-types'

export function extractEntityId(sk: string): string {
  const hash = sk.lastIndexOf('#')
  return hash >= 0 ? sk.slice(hash + 1) : sk
}

export function secureRemoteAssetUrl(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url
}

export function toTrailView(trail: FjallTrail): FjallTrailView {
  return {
    id: extractEntityId(trail.sk),
    name: trail.name,
    createdAt: trail.createdAt,
  }
}

export function toMarkerView(marker: FjallMarker): FjallMarkerView {
  return {
    id: extractEntityId(marker.sk),
    name: marker.name,
    color: marker.color,
    icon: marker.icon ?? null,
    createdAt: marker.createdAt,
    waypointCount: marker.waypointCount ?? 0,
  }
}

export function toWaypointView(
  waypoint: FjallWaypoint,
  trailsById: Map<string, FjallTrailView>,
): FjallWaypointView {
  const trailId = waypoint.trailId ?? null
  return {
    id: extractEntityId(waypoint.sk),
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

import type { CairnBurn, CairnCacheUtilization } from '@/lib/cairn-types'
import { toMarkerId } from '@/lib/embedded-markers'

export const audrFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function skattUtilizationColor(pct: number) {
  if (pct >= 100) return 'bg-destructive'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

export function burnMarkerKey(burn: CairnBurn): string {
  return toMarkerId(burn.markers[0]) ?? 'uncategorized'
}

export function markerShortLabel(
  markerId: string,
  markers: { id: string; name: string }[],
  cache?: CairnCacheUtilization,
): string {
  if (markerId === 'uncategorized') return 'Uncategorized'
  const name =
    markers.find((m) => m.id === markerId)?.name ??
    cache?.marker?.name ??
    null
  if (!name) return 'Uncategorized'
  return name.split('/').pop() ?? name
}

export function groupBurnsByMarker(burns: CairnBurn[]) {
  const groups = new Map<string, CairnBurn[]>()
  for (const burn of burns) {
    const key = burnMarkerKey(burn)
    const list = groups.get(key) ?? []
    list.push(burn)
    groups.set(key, list)
  }
  return groups
}

export type SurtrCanvasGroup = {
  markerId: string
  burns: CairnBurn[]
  cache?: CairnCacheUtilization
}

export function buildSurtrCanvasGroups(
  burns: CairnBurn[],
  cacheUtilization: CairnCacheUtilization[],
  markers: { id: string; name: string }[] = [],
): SurtrCanvasGroup[] {
  const burnGroups = groupBurnsByMarker(burns)
  const markerIds = new Set<string>()
  for (const cache of cacheUtilization) markerIds.add(cache.markerId)
  for (const markerId of burnGroups.keys()) markerIds.add(markerId)

  return [...markerIds]
    .sort((a, b) =>
      markerShortLabel(a, markers, cacheUtilization.find((e) => e.markerId === a)).localeCompare(
        markerShortLabel(b, markers, cacheUtilization.find((e) => e.markerId === b)),
        undefined,
        { sensitivity: 'base' },
      ),
    )
    .map((markerId) => ({
      markerId,
      burns: [...(burnGroups.get(markerId) ?? [])].sort(
        (l, r) => new Date(r.date).getTime() - new Date(l.date).getTime(),
      ),
      cache: cacheUtilization.find((e) => e.markerId === markerId),
    }))
}

export function monthYearLabel(month: number, year: number) {
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function shiftMonth(month: number, year: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1)
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

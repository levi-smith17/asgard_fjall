import type { CairnBurn, CairnCacheUtilization, CairnSjodrView } from '@/lib/data-types'
import { markerDisplayName, toMarkerId } from '@/lib/embedded-markers'

export const AUDR_UNASSIGNED_SJODR = 'unassigned'
export type AudrCanvasGroupBy = 'run' | 'sjodr'

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
    markerDisplayName(cache?.marker)
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
      markerShortLabel(
        a,
        markers,
        cacheUtilization.find((entry) => entry.markerId === a),
      ).localeCompare(
        markerShortLabel(
          b,
          markers,
          cacheUtilization.find((entry) => entry.markerId === b),
        ),
        undefined,
        { sensitivity: 'base' },
      ),
    )
    .map((markerId) => ({
      markerId,
      burns: [...(burnGroups.get(markerId) ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
      cache: cacheUtilization.find((entry) => entry.markerId === markerId),
    }))
}

export function filterAudrBySjodr<T extends { fundId?: string | null }>(
  rows: T[],
  fundFilter: string,
): T[] {
  if (fundFilter === 'all') return rows
  if (fundFilter === AUDR_UNASSIGNED_SJODR) {
    return rows.filter((row) => !row.fundId)
  }
  return rows.filter((row) => row.fundId === fundFilter)
}

export type SurtrSjodrSection = {
  fundId: string | null
  fundName: string
  groups: SurtrCanvasGroup[]
}

export function buildSurtrSjodrSections(
  burns: CairnBurn[],
  cacheUtilization: CairnCacheUtilization[],
  funds: CairnSjodrView[],
  markers: { id: string; name: string }[] = [],
): SurtrSjodrSection[] {
  const fundNameById = new Map(funds.map((fund) => [fund.id, fund.name]))
  const keys = new Set<string>()
  for (const cache of cacheUtilization) keys.add(cache.fundId ?? AUDR_UNASSIGNED_SJODR)
  for (const burn of burns) keys.add(burn.fundId ?? AUDR_UNASSIGNED_SJODR)

  const ordered = [...keys].sort((left, right) => {
    if (left === AUDR_UNASSIGNED_SJODR) return 1
    if (right === AUDR_UNASSIGNED_SJODR) return -1
    const leftName = fundNameById.get(left) ?? left
    const rightName = fundNameById.get(right) ?? right
    return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' })
  })

  return ordered.map((key) => {
    const fundId = key === AUDR_UNASSIGNED_SJODR ? null : key
    const sectionBurns = burns.filter((burn) => (burn.fundId ?? null) === fundId)
    const sectionCaches = cacheUtilization.filter((cache) => (cache.fundId ?? null) === fundId)
    return {
      fundId,
      fundName:
        fundId == null
          ? 'Unassigned'
          : (fundNameById.get(fundId) ?? 'Unknown fund'),
      groups: buildSurtrCanvasGroups(sectionBurns, sectionCaches, markers),
    }
  })
}

export function monthYearLabel(month: number, year: number) {
  return new Date(year, month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })
}

export function shiftMonth(month: number, year: number, delta: number) {
  const date = new Date(year, month - 1 + delta, 1)
  return { month: date.getMonth() + 1, year: date.getFullYear() }
}

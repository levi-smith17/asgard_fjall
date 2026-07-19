import type { FjallBurn, FjallCacheUtilization, FjallSjodrView } from '@/lib/data-types'
import { runDisplayName, toRunId } from '@/lib/embedded-runir'

export const AUDR_UNASSIGNED_SJODR = 'unassigned'
export type AudrCanvasGroupBy = 'run' | 'sjodr'

export const audrFmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

export function skattUtilizationColor(pct: number) {
  if (pct >= 100) return 'bg-destructive'
  if (pct >= 80) return 'bg-amber-500'
  return 'bg-primary'
}

export function burnRunKey(burn: FjallBurn): string {
  const runir = burn.runir ?? burn.markers ?? []
  return toRunId(runir[0]) ?? 'uncategorized'
}

export function runShortLabel(
  runId: string,
  runir: { id: string; name: string }[],
  cache?: FjallCacheUtilization,
): string {
  if (runId === 'uncategorized') return 'Uncategorized'
  const name =
    runir.find((m) => m.id === runId)?.name ??
    cache?.run?.name ??
    runDisplayName(cache?.run)
  if (!name) return 'Uncategorized'
  return name.split('/').pop() ?? name
}

export function groupBurnsByRun(burns: FjallBurn[]) {
  const groups = new Map<string, FjallBurn[]>()
  for (const burn of burns) {
    const key = burnRunKey(burn)
    const list = groups.get(key) ?? []
    list.push(burn)
    groups.set(key, list)
  }
  return groups
}

export type SurtrCanvasGroup = {
  runId: string
  burns: FjallBurn[]
  cache?: FjallCacheUtilization
}

export function buildSurtrCanvasGroups(
  burns: FjallBurn[],
  cacheUtilization: FjallCacheUtilization[],
  runir: { id: string; name: string }[] = [],
): SurtrCanvasGroup[] {
  const burnGroups = groupBurnsByRun(burns)
  const runIds = new Set<string>()
  for (const cache of cacheUtilization) runIds.add(cache.runId)
  for (const runId of burnGroups.keys()) runIds.add(runId)

  return [...runIds]
    .sort((a, b) =>
      runShortLabel(
        a,
        runir,
        cacheUtilization.find((entry) => entry.runId === a),
      ).localeCompare(
        runShortLabel(
          b,
          runir,
          cacheUtilization.find((entry) => entry.runId === b),
        ),
        undefined,
        { sensitivity: 'base' },
      ),
    )
    .map((runId) => ({
      runId,
      burns: [...(burnGroups.get(runId) ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
      cache: cacheUtilization.find((entry) => entry.runId === runId),
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
  burns: FjallBurn[],
  cacheUtilization: FjallCacheUtilization[],
  funds: FjallSjodrView[],
  runir: { id: string; name: string }[] = [],
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
      groups: buildSurtrCanvasGroups(sectionBurns, sectionCaches, runir),
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

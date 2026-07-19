import type { FjallSurtr, FjallSkattUtilization, FjallSjodrView } from '@/lib/data-types'
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

export function surtrRunKey(surtr: FjallSurtr): string {
  return toRunId((surtr.runir ?? [])[0]) ?? 'uncategorized'
}

export function runShortLabel(
  runId: string,
  runir: { id: string; name: string }[],
  skatt?: FjallSkattUtilization,
): string {
  if (runId === 'uncategorized') return 'Uncategorized'
  const name =
    runir.find((m) => m.id === runId)?.name ??
    skatt?.run?.name ??
    runDisplayName(skatt?.run)
  if (!name) return 'Uncategorized'
  return name.split('/').pop() ?? name
}

export function groupSurtrByRun(surtrItems: FjallSurtr[]) {
  const groups = new Map<string, FjallSurtr[]>()
  for (const surtr of surtrItems) {
    const key = surtrRunKey(surtr)
    const list = groups.get(key) ?? []
    list.push(surtr)
    groups.set(key, list)
  }
  return groups
}

export type SurtrCanvasGroup = {
  runId: string
  surtrItems: FjallSurtr[]
  skatt?: FjallSkattUtilization
}

export function buildSurtrCanvasGroups(
  surtrItems: FjallSurtr[],
  skattUtilization: FjallSkattUtilization[],
  runir: { id: string; name: string }[] = [],
): SurtrCanvasGroup[] {
  const burnGroups = groupSurtrByRun(surtrItems)
  const runIds = new Set<string>()
  for (const skatt of skattUtilization) runIds.add(skatt.runId)
  for (const runId of burnGroups.keys()) runIds.add(runId)

  return [...runIds]
    .sort((a, b) =>
      runShortLabel(
        a,
        runir,
        skattUtilization.find((entry) => entry.runId === a),
      ).localeCompare(
        runShortLabel(
          b,
          runir,
          skattUtilization.find((entry) => entry.runId === b),
        ),
        undefined,
        { sensitivity: 'base' },
      ),
    )
    .map((runId) => ({
      runId,
      surtrItems: [...(burnGroups.get(runId) ?? [])].sort(
        (left, right) => new Date(right.date).getTime() - new Date(left.date).getTime(),
      ),
      skatt: skattUtilization.find((entry) => entry.runId === runId),
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
  surtrItems: FjallSurtr[],
  skattUtilization: FjallSkattUtilization[],
  funds: FjallSjodrView[],
  runir: { id: string; name: string }[] = [],
): SurtrSjodrSection[] {
  const fundNameById = new Map(funds.map((fund) => [fund.id, fund.name]))
  const keys = new Set<string>()
  for (const skatt of skattUtilization) keys.add(skatt.fundId ?? AUDR_UNASSIGNED_SJODR)
  for (const surtr of surtrItems) keys.add(surtr.fundId ?? AUDR_UNASSIGNED_SJODR)

  const ordered = [...keys].sort((left, right) => {
    if (left === AUDR_UNASSIGNED_SJODR) return 1
    if (right === AUDR_UNASSIGNED_SJODR) return -1
    const leftName = fundNameById.get(left) ?? left
    const rightName = fundNameById.get(right) ?? right
    return leftName.localeCompare(rightName, undefined, { sensitivity: 'base' })
  })

  return ordered.map((key) => {
    const fundId = key === AUDR_UNASSIGNED_SJODR ? null : key
    const sectionBurns = surtrItems.filter((surtr) => (surtr.fundId ?? null) === fundId)
    const sectionCaches = skattUtilization.filter((skatt) => (skatt.fundId ?? null) === fundId)
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

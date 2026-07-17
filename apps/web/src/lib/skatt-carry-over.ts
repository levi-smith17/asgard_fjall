import { fetchProvisionsSummary, saveFjallCache } from '@/lib/data-api'

export type FjallCacheCarryOverResult = {
  count: number
  sourceMonth: number
  sourceYear: number
}

export type FjallCacheCarryItem = {
  markerId: string
  limit: number
}

function previousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

/** Copy selected Skatt limits into a target month (skips markers already present). */
export async function carrySelectedFjallCacheToMonth(
  targetMonth: number,
  targetYear: number,
  items: FjallCacheCarryItem[],
): Promise<{ created: number; skipped: number }> {
  if (items.length === 0) return { created: 0, skipped: 0 }

  const targetSummary = await fetchProvisionsSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(targetSummary.cacheUtilization.map((b) => b.markerId))

  let created = 0
  let skipped = 0

  for (const item of items) {
    if (existingMarkerIds.has(item.markerId)) {
      skipped++
      continue
    }
    await saveFjallCache({
      markerId: item.markerId,
      limit: item.limit,
      month: targetMonth,
      year: targetYear,
    })
    existingMarkerIds.add(item.markerId)
    created++
  }

  return { created, skipped }
}

/** Copy Skatt limits from the most recent prior month that has budgets. */
export async function carryOverFjallCacheToMonth(
  targetMonth: number,
  targetYear: number,
  options?: { maxMonthsBack?: number },
): Promise<FjallCacheCarryOverResult | null> {
  const maxMonthsBack = options?.maxMonthsBack ?? 24

  const targetSummary = await fetchProvisionsSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(targetSummary.cacheUtilization.map((b) => b.markerId))

  let { month, year } = previousMonth(targetMonth, targetYear)

  for (let i = 0; i < maxMonthsBack; i++) {
    const summary = await fetchProvisionsSummary(month, year)
    const toCreate = summary.cacheUtilization.filter((b) => !existingMarkerIds.has(b.markerId))

    if (toCreate.length > 0) {
      const result = await carrySelectedFjallCacheToMonth(
        targetMonth,
        targetYear,
        toCreate.map((b) => ({ markerId: b.markerId, limit: b.limit })),
      )
      if (result.created === 0) {
        ;({ month, year } = previousMonth(month, year))
        continue
      }
      return { count: result.created, sourceMonth: month, sourceYear: year }
    }

    ;({ month, year } = previousMonth(month, year))
  }

  return null
}

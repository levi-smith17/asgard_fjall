import { fetchCairnProvisionsSummary, saveCairnCache } from '@/lib/data-api'

export type CairnCacheCarryOverResult = {
  count: number
  sourceMonth: number
  sourceYear: number
}

export type CairnCacheCarryItem = {
  markerId: string
  limit: number
}

function previousMonth(month: number, year: number): { month: number; year: number } {
  if (month === 1) return { month: 12, year: year - 1 }
  return { month: month - 1, year }
}

/** Copy selected Skatt limits into a target month (skips markers already present). */
export async function carrySelectedCairnCacheToMonth(
  targetMonth: number,
  targetYear: number,
  items: CairnCacheCarryItem[],
): Promise<{ created: number; skipped: number }> {
  if (items.length === 0) return { created: 0, skipped: 0 }

  const targetSummary = await fetchCairnProvisionsSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(targetSummary.cacheUtilization.map((b) => b.markerId))

  let created = 0
  let skipped = 0

  for (const item of items) {
    if (existingMarkerIds.has(item.markerId)) {
      skipped++
      continue
    }
    await saveCairnCache({
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
export async function carryOverCairnCacheToMonth(
  targetMonth: number,
  targetYear: number,
  options?: { maxMonthsBack?: number },
): Promise<CairnCacheCarryOverResult | null> {
  const maxMonthsBack = options?.maxMonthsBack ?? 24

  const targetSummary = await fetchCairnProvisionsSummary(targetMonth, targetYear)
  const existingMarkerIds = new Set(targetSummary.cacheUtilization.map((b) => b.markerId))

  let { month, year } = previousMonth(targetMonth, targetYear)

  for (let i = 0; i < maxMonthsBack; i++) {
    const summary = await fetchCairnProvisionsSummary(month, year)
    const toCreate = summary.cacheUtilization.filter((b) => !existingMarkerIds.has(b.markerId))

    if (toCreate.length > 0) {
      const result = await carrySelectedCairnCacheToMonth(
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

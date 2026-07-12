import type { CairnCacheUtilization, CairnSupplyline } from '@/lib/cairn-types'
import { toMarkerId } from '@/lib/embedded-markers'

const MONTHLY_OR_LESS = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])

export function supplylineCountsAgainstSkatt(billingCycle: string): boolean {
  return MONTHLY_OR_LESS.has(billingCycle)
}

export function supplylineMonthlyAmount(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'WEEKLY': return (amount * 52) / 12
    case 'BIWEEKLY': return (amount * 26) / 12
    case 'MONTHLY': return amount
    default: return 0
  }
}

export function idunnSpendForMarker(supplylines: CairnSupplyline[], markerId: string): number {
  return supplylines
    .filter((line) => line.active)
    .filter((line) => supplylineCountsAgainstSkatt(line.billingCycle))
    .filter((line) => line.markers.some((marker) => toMarkerId(marker) === markerId))
    .reduce((sum, line) => sum + supplylineMonthlyAmount(line.amount, line.billingCycle), 0)
}

export function effectiveSkattSpent(
  cache: CairnCacheUtilization,
  supplylines: CairnSupplyline[],
): number {
  return cache.spent + idunnSpendForMarker(supplylines, cache.markerId)
}

export function effectiveSkattUtilization(
  cache: CairnCacheUtilization,
  supplylines: CairnSupplyline[],
): number {
  const spent = effectiveSkattSpent(cache, supplylines)
  return cache.limit > 0 ? (spent / cache.limit) * 100 : 0
}

export function totalEffectiveSkattUtilization(
  cacheUtilization: CairnCacheUtilization[],
  supplylines: CairnSupplyline[],
): number | null {
  const totalSpent = cacheUtilization.reduce(
    (sum, cache) => sum + effectiveSkattSpent(cache, supplylines),
    0,
  )
  const totalLimit = cacheUtilization.reduce((sum, cache) => sum + cache.limit, 0)
  return totalLimit > 0 ? (totalSpent / totalLimit) * 100 : null
}

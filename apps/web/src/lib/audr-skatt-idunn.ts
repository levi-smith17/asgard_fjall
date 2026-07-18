import type { FjallCacheUtilization, FjallSupplyline } from '@/lib/data-types'
import { toMarkerId } from '@/lib/embedded-markers'
import { getRenewalInMonth } from '@/lib/idunn-renewal'

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

export function idunnLinesForMarker(
  supplylines: FjallSupplyline[],
  markerId: string,
  month?: number,
  year?: number,
): FjallSupplyline[] {
  return supplylines.filter((line) => {
    if (!line.markers.some((marker) => toMarkerId(marker) === markerId)) return false
    if (month == null || year == null) return true
    return getRenewalInMonth(line.nextRenewal, line.billingCycle, month, year) != null
  })
}

export function idunnSpendForMarker(supplylines: FjallSupplyline[], markerId: string): number {
  return idunnLinesForMarker(supplylines, markerId)
    .filter((line) => line.active)
    .filter((line) => supplylineCountsAgainstSkatt(line.billingCycle))
    .reduce((sum, line) => sum + supplylineMonthlyAmount(line.amount, line.billingCycle), 0)
}

export function effectiveSkattSpent(
  cache: FjallCacheUtilization,
  supplylines: FjallSupplyline[],
): number {
  return cache.spent + idunnSpendForMarker(supplylines, cache.markerId)
}

export function effectiveSkattUtilization(
  cache: FjallCacheUtilization,
  supplylines: FjallSupplyline[],
): number {
  const spent = effectiveSkattSpent(cache, supplylines)
  return cache.limit > 0 ? (spent / cache.limit) * 100 : 0
}

export function totalEffectiveSkattUtilization(
  cacheUtilization: FjallCacheUtilization[],
  supplylines: FjallSupplyline[],
): number | null {
  const totalSpent = cacheUtilization.reduce(
    (sum, cache) => sum + effectiveSkattSpent(cache, supplylines),
    0,
  )
  const totalLimit = cacheUtilization.reduce((sum, cache) => sum + cache.limit, 0)
  return totalLimit > 0 ? (totalSpent / totalLimit) * 100 : null
}

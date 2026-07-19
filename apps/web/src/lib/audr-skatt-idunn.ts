import type { FjallSkattUtilization, FjallIdunn } from '@/lib/data-types'
import { toRunId } from '@/lib/embedded-runir'
import { getRenewalInMonth } from '@/lib/idunn-renewal'

const MONTHLY_OR_LESS = new Set(['WEEKLY', 'BIWEEKLY', 'MONTHLY'])

export function idunnCountsAgainstSkatt(billingCycle: string): boolean {
  return MONTHLY_OR_LESS.has(billingCycle)
}

export function idunnMonthlyAmount(amount: number, billingCycle: string): number {
  switch (billingCycle) {
    case 'WEEKLY': return (amount * 52) / 12
    case 'BIWEEKLY': return (amount * 26) / 12
    case 'MONTHLY': return amount
    default: return 0
  }
}

export function idunnLinesForRun(
  idunnItems: FjallIdunn[],
  runId: string,
  month?: number,
  year?: number,
): FjallIdunn[] {
  return idunnItems.filter((line) => {
    const runir = line.runir ?? []
    if (!runir.some((run) => toRunId(run) === runId)) return false
    if (month == null || year == null) return true
    return getRenewalInMonth(line.nextRenewal, line.billingCycle, month, year) != null
  })
}

export function idunnSpendForRun(idunnItems: FjallIdunn[], runId: string): number {
  return idunnLinesForRun(idunnItems, runId)
    .filter((line) => line.active)
    .filter((line) => idunnCountsAgainstSkatt(line.billingCycle))
    .reduce((sum, line) => sum + idunnMonthlyAmount(line.amount, line.billingCycle), 0)
}

export function effectiveSkattSpent(
  skatt: FjallSkattUtilization,
  idunnItems: FjallIdunn[],
): number {
  return skatt.spent + idunnSpendForRun(idunnItems, skatt.runId)
}

export function effectiveSkattUtilization(
  skatt: FjallSkattUtilization,
  idunnItems: FjallIdunn[],
): number {
  const spent = effectiveSkattSpent(skatt, idunnItems)
  return skatt.limit > 0 ? (spent / skatt.limit) * 100 : 0
}

export function totalEffectiveSkattUtilization(
  skattUtilization: FjallSkattUtilization[],
  idunnItems: FjallIdunn[],
): number | null {
  const totalSpent = skattUtilization.reduce(
    (sum, skatt) => sum + effectiveSkattSpent(skatt, idunnItems),
    0,
  )
  const totalLimit = skattUtilization.reduce((sum, skatt) => sum + skatt.limit, 0)
  return totalLimit > 0 ? (totalSpent / totalLimit) * 100 : null
}

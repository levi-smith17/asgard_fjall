const BILLING_CYCLES = ['WEEKLY', 'BIWEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUALLY'] as const
export type FjallBillingCycle = (typeof BILLING_CYCLES)[number]

function isBillingCycle(value: string): value is FjallBillingCycle {
  return (BILLING_CYCLES as readonly string[]).includes(value)
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function parseRenewalDate(nextRenewal: string): Date {
  const datePart = nextRenewal.slice(0, 10)
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(datePart)
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
  }
  return new Date(nextRenewal)
}

function advanceRenewal(date: Date, billingCycle: FjallBillingCycle): void {
  switch (billingCycle) {
    case 'WEEKLY': date.setDate(date.getDate() + 7); break
    case 'BIWEEKLY': date.setDate(date.getDate() + 14); break
    case 'MONTHLY': date.setMonth(date.getMonth() + 1); break
    case 'QUARTERLY': date.setMonth(date.getMonth() + 3); break
    case 'ANNUALLY': date.setFullYear(date.getFullYear() + 1); break
  }
}

export function getEffectiveNextRenewal(
  nextRenewal: string,
  billingCycle: string,
  now: Date = new Date(),
): Date {
  const renewal = parseRenewalDate(nextRenewal)
  if (Number.isNaN(renewal.getTime())) return renewal
  const cycle = isBillingCycle(billingCycle) ? billingCycle : 'MONTHLY'
  const today = startOfDay(now)
  let guard = 0
  while (startOfDay(renewal) < today && guard < 500) {
    advanceRenewal(renewal, cycle)
    guard++
  }
  return renewal
}

export function daysUntilRenewal(
  nextRenewal: string,
  billingCycle: string,
  now: Date = new Date(),
): number {
  const effective = getEffectiveNextRenewal(nextRenewal, billingCycle, now)
  return Math.ceil((effective.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

/** Calendar helpers for `<input type="date|month">` — use America/New_York, never UTC. */

export const APP_CALENDAR_TIMEZONE = 'America/New_York'

/** YYYY-MM-DD in the app calendar timezone (default Eastern). */
export function dateInputValueInTimeZone(
  date: Date = new Date(),
  timeZone: string = APP_CALENDAR_TIMEZONE,
): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Prefer this over `toISOString().split('T')[0]` for date input defaults. */
export function todayDateInputValue(timeZone: string = APP_CALENDAR_TIMEZONE): string {
  return dateInputValueInTimeZone(new Date(), timeZone)
}

/** ISO or date-only string → YYYY-MM-DD for date inputs. */
export function toDateInputValue(
  iso: string | null | undefined,
  timeZone: string = APP_CALENDAR_TIMEZONE,
): string {
  if (!iso) return todayDateInputValue(timeZone)
  // Calendar-only values are already in app-local day terms — do not shift via UTC.
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso.trim())) return iso.trim().slice(0, 10)
  return dateInputValueInTimeZone(new Date(iso), timeZone)
}

/** YYYY-MM in the app calendar timezone. */
export function monthInputValueInTimeZone(
  date: Date = new Date(),
  timeZone: string = APP_CALENDAR_TIMEZONE,
): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
  }).formatToParts(date)
  const year = parts.find((part) => part.type === 'year')?.value
  const month = parts.find((part) => part.type === 'month')?.value
  return `${year}-${month}`
}

/** First-of-month ISO date string for month fields (YYYY-MM-01). */
export function todayMonthStartInputValue(timeZone: string = APP_CALENDAR_TIMEZONE): string {
  return `${monthInputValueInTimeZone(new Date(), timeZone)}-01`
}

/** ISO or date-only string → YYYY-MM for month inputs. */
export function toMonthInputValue(
  iso: string | null | undefined,
  timeZone: string = APP_CALENDAR_TIMEZONE,
): string {
  if (!iso) return ''
  if (/^\d{4}-\d{2}/.test(iso) && !iso.includes('T')) return iso.slice(0, 7)
  return monthInputValueInTimeZone(new Date(iso), timeZone)
}

/** Parse YYYY-MM-DD into a local Date (no UTC shift). */
export function parseDateInputValue(value: string | null | undefined): Date | undefined {
  if (!value) return undefined
  const trimmed = value.trim()
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return undefined
  const [year, month, day] = trimmed.split('-').map(Number)
  if (!year || !month || !day) return undefined
  const date = new Date(year, month - 1, day)
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return undefined
  }
  return date
}

/** Format a local Date as YYYY-MM-DD (no UTC shift). */
export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const LUVI_MONTHS = ['Unember','Duober','Triember','Quartober','Quintember','Senober','September','October','November','Decober','Undember','Duodenober','Tredecember','Quartodecober','Leapemberi'] as const
export const LUVI_DAYS = ['Monday','Duoday','Triday','Tetraday','Pentaday','Hexaday','Heptaday','Octoday','Enneaday','Decaday','Hendecaday','Dodecaday','Triadecaday'] as const
export type CalendarMode = 'gregorian' | 'luvi' | 'luvi-full'
export interface LuviDate { monthIndex: number; monthName: string; week: 'a' | 'i'; dayInWeek: number; dayName: string; dayOfMonth: number; dayOfYear: number; year: number; isLeapDay: boolean; friendly: string; full: string }

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0
}

function getDayOfYear(date: Date): number {
  const start = Date.UTC(date.getFullYear(), 0, 1)
  const current = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  return Math.floor((current - start) / (1000 * 60 * 60 * 24)) + 1
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] ?? s[v] ?? s[0])
}

export function toLuvi(date: Date): LuviDate {
  const year = date.getFullYear()
  const dayOfYear = getDayOfYear(date)
  const leap = isLeapYear(year)
  if (leap && dayOfYear === 366) {
    return { monthIndex: 14, monthName: 'Leapemberi', week: 'i', dayInWeek: 0, dayName: '', dayOfMonth: 1, dayOfYear, year, isLeapDay: true, friendly: 'Leapemberi (48 Hours Long)', full: 'Leapemberi (48 Hours Long)' }
  }
  let monthInt = Math.floor(dayOfYear / 26)
  const rem = dayOfYear % 26
  const week: 'a' | 'i' = rem === 0 || rem > 13 ? 'i' : 'a'
  let dayInWeek = rem === 0 ? 12 : rem > 13 ? rem - 14 : rem - 1
  if (dayInWeek === 12 && monthInt !== 0) monthInt -= 1
  const friendlyDayNumber = week === 'i' ? dayInWeek + 14 : dayInWeek + 1
  const monthName = LUVI_MONTHS[monthInt] ?? 'Unknown'
  const dayName = LUVI_DAYS[dayInWeek] ?? ''
  return { monthIndex: monthInt, monthName, week, dayInWeek, dayName, dayOfMonth: friendlyDayNumber, dayOfYear, year, isLeapDay: false, friendly: `${monthName} ${ordinal(friendlyDayNumber)}`, full: `${monthName}${week} ${dayName}` }
}

export function luviMonthDates(anchor: Date): Date[] {
  const { monthIndex, year } = toLuvi(anchor)
  const firstDayOfYear = monthIndex * 26 + 1
  return Array.from({ length: 26 }, (_, i) => new Date(year, 0, firstDayOfYear + i))
}

export function luviWeekDates(anchor: Date): Date[] {
  const { monthIndex, week, year } = toLuvi(anchor)
  const firstDayOfYear = monthIndex * 26 + 1
  const weekOffset = week === 'a' ? 0 : 13
  return Array.from({ length: 13 }, (_, i) => new Date(year, 0, firstDayOfYear + weekOffset + i))
}

export function luviNavLabel(view: 'month' | 'week' | 'day', anchor: Date): string {
  const l = toLuvi(anchor)
  if (view === 'month') return `${l.monthName} ${l.year}`
  if (view === 'week') return `${l.monthName}${l.week} ${l.year}`
  return l.full
}

export function formatLuvi(date: Date, mode: 'friendly' | 'full' = 'friendly'): string {
  const l = toLuvi(date)
  return mode === 'friendly' ? l.friendly : l.full
}

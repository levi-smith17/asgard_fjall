export type DagatalCalendarView = 'month' | 'week' | 'day'

export function dagatalEventRange(view: DagatalCalendarView, anchor: Date): { from: string; to: string } {
  if (view === 'month') {
    const start = new Date(anchor.getFullYear(), anchor.getMonth() - 1, 1)
    const end = new Date(anchor.getFullYear(), anchor.getMonth() + 2, 0, 23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  if (view === 'week') {
    const start = new Date(anchor)
    start.setDate(anchor.getDate() - anchor.getDay() - 7)
    start.setHours(0, 0, 0, 0)
    const end = new Date(anchor)
    end.setDate(anchor.getDate() - anchor.getDay() + 13)
    end.setHours(23, 59, 59, 999)
    return { from: start.toISOString(), to: end.toISOString() }
  }
  const start = new Date(anchor)
  start.setDate(anchor.getDate() - 1)
  start.setHours(0, 0, 0, 0)
  const end = new Date(anchor)
  end.setDate(anchor.getDate() + 1)
  end.setHours(23, 59, 59, 999)
  return { from: start.toISOString(), to: end.toISOString() }
}

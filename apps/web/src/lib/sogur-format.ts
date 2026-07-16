import type { CairnLogView } from '@/lib/data-api'

export type SogurLogbook = {
  id: string
  trailId: string
  name: string
  logs: CairnLogView[]
  pageCount: number
  updatedAt: string
}

export function sortCairnLogs(logs: CairnLogView[]): CairnLogView[] {
  return [...logs].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position
    if (a.position != null) return -1
    if (b.position != null) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

export function groupLogsIntoLogbooks(logs: CairnLogView[]): SogurLogbook[] {
  const map = new Map<string, CairnLogView[]>()
  for (const log of logs) {
    if (!log.trailId) continue
    const bucket = map.get(log.trailId)
    if (bucket) bucket.push(log)
    else map.set(log.trailId, [log])
  }

  const books: SogurLogbook[] = []
  for (const [trailId, trailLogs] of map.entries()) {
    const sorted = sortCairnLogs(trailLogs)
    const latest = sorted.reduce(
      (max, log) =>
        new Date(log.createdAt).getTime() > new Date(max).getTime() ? log.createdAt : max,
      sorted[0]?.createdAt ?? new Date(0).toISOString(),
    )
    books.push({
      id: trailId,
      trailId,
      name: sorted[0]?.trailName ?? 'Grein',
      logs: sorted,
      pageCount: sorted.length,
      updatedAt: latest,
    })
  }
  return books.sort((a, b) => a.name.localeCompare(b.name))
}

export function pagePreview(log: CairnLogView): string {
  return (
    log.title ||
    log.content.replace(/<[^>]*>/g, '').trim().slice(0, 80) ||
    'Empty page'
  )
}

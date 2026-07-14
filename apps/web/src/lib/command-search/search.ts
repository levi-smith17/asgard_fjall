import type { CommandSearchEntry } from '@/lib/command-search/types'
import { foldSearchText, includesFoldedSearch } from '@/lib/utils'

function entryHaystack(entry: CommandSearchEntry): string {
  return [entry.label, entry.subtitle, entry.areaPill, entry.productPill, ...entry.keywords]
    .filter(Boolean)
    .join(' ')
}

function scoreEntry(entry: CommandSearchEntry, q: string): number {
  const label = foldSearchText(entry.label)
  const haystack = foldSearchText(entryHaystack(entry))
  const foldedQuery = foldSearchText(q)
  const tokens = q.split(/\s+/).filter(Boolean).map(foldSearchText)

  if (tokens.length > 1 && tokens.every((token) => haystack.includes(token))) return 90
  if (label.startsWith(foldedQuery)) return 100
  if (label.includes(foldedQuery)) return 80
  if (includesFoldedSearch(entryHaystack(entry), q)) return 60
  return 0
}

export function searchCommandIndex(
  entries: CommandSearchEntry[],
  query: string,
  limit = 16,
): CommandSearchEntry[] {
  const q = query.trim()
  if (!q) return []

  return entries
    .map((entry) => ({ entry, score: scoreEntry(entry, q) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map(({ entry }) => entry)
}

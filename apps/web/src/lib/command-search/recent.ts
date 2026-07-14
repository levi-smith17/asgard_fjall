import type { CommandSearchEntry } from '@/lib/command-search/types'

const STORAGE_KEY = 'fjall-command-search-recent'
const MAX_RECENTS = 8

type RecentStore = Record<string, CommandSearchEntry[]>

function readStore(): RecentStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw) as RecentStore
  } catch {
    return {}
  }
}

function writeStore(store: RecentStore) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  } catch {
    /* ignore */
  }
}

export function loadRecentCommandSearch(userId: string): CommandSearchEntry[] {
  return readStore()[userId] ?? []
}

export function recordCommandSearchRecent(
  userId: string,
  entry: CommandSearchEntry,
): CommandSearchEntry[] {
  const store = readStore()
  const current = store[userId] ?? []
  const next = [entry, ...current.filter((item) => item.id !== entry.id)].slice(0, MAX_RECENTS)
  store[userId] = next
  writeStore(store)
  return next
}

export function hydrateRecentCommandSearch(
  recents: CommandSearchEntry[],
  index: CommandSearchEntry[],
): CommandSearchEntry[] {
  if (recents.length === 0) return []
  const byId = new Map(index.map((entry) => [entry.id, entry]))
  return recents.map((entry) => byId.get(entry.id) ?? entry)
}

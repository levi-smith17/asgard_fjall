import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { useTerminology } from '@/hooks/use-terminology'
import { searchCairn, type CairnSearchResultType } from '@/lib/cairn-api'
import { buildFjallNavigationEntries } from '@/lib/command-search/build-fjall-nav'
import {
  hydrateRecentCommandSearch,
  loadRecentCommandSearch,
  recordCommandSearchRecent,
} from '@/lib/command-search/recent'
import { searchCommandIndex } from '@/lib/command-search/search'
import type { CommandSearchArea, CommandSearchEntry } from '@/lib/command-search/types'

const AREA_FOR_TYPE: Record<CairnSearchResultType, CommandSearchArea> = {
  waypoint: 'Hlidskjalf',
  trail: 'Catalog',
  marker: 'Catalog',
  log: 'Journal',
  provision: 'Audr',
  stop: 'Navigation',
}

function cairnResultToEntry(
  result: Awaited<ReturnType<typeof searchCairn>>[number],
  productPill: string,
): CommandSearchEntry {
  return {
    id: `cairn-${result.type}-${result.id}`,
    label: result.title,
    subtitle: result.subtitle,
    productPill,
    areaPill: AREA_FOR_TYPE[result.type] ?? 'Navigation',
    path: result.url,
    externalUrl: result.externalUrl,
    keywords: [result.type, result.title, result.subtitle ?? ''],
  }
}

export function useCommandSearchIndex(query: string) {
  const auth = useAuth()
  const { terms } = useTerminology()
  const userId = auth.gateUser?.email ?? auth.cairnUser?.email ?? 'guest'
  const debouncedQuery = useDebounce(query.trim(), 200)

  const navEntries = useMemo(() => buildFjallNavigationEntries(terms), [terms])

  const [recents, setRecents] = useState<CommandSearchEntry[]>(() =>
    loadRecentCommandSearch(userId),
  )

  useEffect(() => {
    setRecents(loadRecentCommandSearch(userId))
  }, [userId])

  const cairnQuery = useQuery({
    queryKey: ['fjall-command-search', debouncedQuery],
    queryFn: () => searchCairn(debouncedQuery, true),
    enabled: debouncedQuery.length >= 2 && Boolean(auth.cairnUser),
    staleTime: 15_000,
  })

  const cairnEntries = useMemo(
    () => (cairnQuery.data ?? []).map((result) => cairnResultToEntry(result, terms.productName)),
    [cairnQuery.data, terms.productName],
  )

  const results = useMemo(() => {
    const q = query.trim()
    if (!q) {
      return hydrateRecentCommandSearch(recents, [...navEntries, ...cairnEntries])
    }

    const navHits = searchCommandIndex(navEntries, q, 12)
    const merged = [...navHits]
    const seen = new Set(navHits.map((entry) => entry.id))
    for (const entry of cairnEntries) {
      if (seen.has(entry.id)) continue
      merged.push(entry)
      seen.add(entry.id)
    }
    return merged.slice(0, 16)
  }, [cairnEntries, navEntries, query, recents])

  const recordRecent = useCallback(
    (entry: CommandSearchEntry) => {
      setRecents(recordCommandSearchRecent(userId, entry))
    },
    [userId],
  )

  return {
    results,
    isIndexing: cairnQuery.isFetching,
    recordRecent,
    isShowingRecents: !query.trim() && results.length > 0,
  }
}

export type { CommandSearchEntry }

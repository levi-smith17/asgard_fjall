import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Bookmark,
  CalendarDays,
  Clock,
  Folder,
  LogIn,
  LogOut,
  NotebookPen,
  Search,
  Tag,
  Wallet,
} from 'lucide-react'
import { Input } from '@/components/core/ui/input'
import { useCommandPalette } from '@/context/command-palette-context'
import { useAuth } from '@/hooks/use-auth'
import { useDebounce } from '@/hooks/use-debounce'
import { useTerminology } from '@/hooks/use-terminology'
import {
  searchCairn,
  type CairnSearchResult,
  type CairnSearchResultType,
} from '@/lib/cairn-api'
import { cn } from '@/lib/utils'

const RECENT_KEY = 'fjall:recent-search'
const RECENT_MAX = 8

type StoredResult = Omit<CairnSearchResult, 'score'>

type ActionEntry = {
  id: string
  kind: 'action'
  label: string
  subtitle?: string
  action: 'sign-out' | 'sign-in'
}

type PaletteEntry =
  | ({ kind: 'result' } & (CairnSearchResult | StoredResult))
  | ActionEntry

function loadRecents(): StoredResult[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? '[]') as StoredResult[]
  } catch {
    return []
  }
}

function saveRecent(result: CairnSearchResult | StoredResult) {
  try {
    const prev = loadRecents().filter((r) => !(r.id === result.id && r.type === result.type))
    const { score: _score, ...stored } = result as CairnSearchResult
    const next = [stored, ...prev].slice(0, RECENT_MAX)
    localStorage.setItem(RECENT_KEY, JSON.stringify(next))
  } catch {
    // ignore
  }
}

function buildTypeMeta(terms: ReturnType<typeof useTerminology>['terms']): Record<
  CairnSearchResultType,
  { label: string; Icon: React.ElementType; bg: string; text: string }
> {
  return {
    waypoint: {
      label: terms.laufarSingular,
      Icon: Bookmark,
      bg: 'bg-blue-500/15',
      text: 'text-blue-600 dark:text-blue-400',
    },
    log: {
      label: terms.notesSingular,
      Icon: NotebookPen,
      bg: 'bg-purple-500/15',
      text: 'text-purple-600 dark:text-purple-400',
    },
    provision: {
      label: terms.provisions,
      Icon: Wallet,
      bg: 'bg-green-500/15',
      text: 'text-green-600 dark:text-green-400',
    },
    stop: {
      label: terms.calendar,
      Icon: CalendarDays,
      bg: 'bg-orange-500/15',
      text: 'text-orange-600 dark:text-orange-400',
    },
    trail: {
      label: terms.greinSingular,
      Icon: Folder,
      bg: 'bg-slate-500/15',
      text: 'text-slate-600 dark:text-slate-400',
    },
    marker: {
      label: terms.runSingular,
      Icon: Tag,
      bg: 'bg-slate-500/15',
      text: 'text-slate-600 dark:text-slate-400',
    },
  }
}

function ResultRow({
  entry,
  active,
  onSelect,
  typeMeta,
}: {
  entry: PaletteEntry
  active: boolean
  onSelect: () => void
  typeMeta: ReturnType<typeof buildTypeMeta>
}) {
  if (entry.kind === 'action') {
    return (
      <button
        type="button"
        role="option"
        aria-selected={active}
        onClick={onSelect}
        className={cn(
          'flex w-full items-start gap-3 px-4 py-3 text-left transition-colors',
          active ? 'bg-primary/10' : 'hover:bg-muted/50',
        )}
      >
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">{entry.label}</div>
          {entry.subtitle ? (
            <div className="truncate text-xs text-muted-foreground">{entry.subtitle}</div>
          ) : null}
        </div>
        {entry.action === 'sign-out' ? (
          <LogOut className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        ) : (
          <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        )}
      </button>
    )
  }

  const meta = typeMeta[entry.type]
  const { Icon } = meta

  return (
    <button
      type="button"
      role="option"
      aria-selected={active}
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors',
        active ? 'bg-muted' : 'hover:bg-muted/50',
      )}
    >
      <div className={cn('flex h-7 w-7 shrink-0 items-center justify-center rounded-md', meta.bg)}>
        {entry.type === 'marker' && entry.color ? (
          <div className="h-3 w-3 rounded-full" style={{ backgroundColor: entry.color }} />
        ) : (
          <Icon className={cn('h-3.5 w-3.5', meta.text)} />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{entry.title}</p>
        {entry.subtitle ? (
          <p className="truncate text-xs text-muted-foreground">{entry.subtitle}</p>
        ) : null}
      </div>
      <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium', meta.bg, meta.text)}>
        {meta.label}
      </span>
    </button>
  )
}

export function CommandPaletteDialog() {
  const { open, closeCommandPalette } = useCommandPalette()
  const navigate = useNavigate()
  const auth = useAuth()
  const { terms } = useTerminology()
  const typeMeta = useMemo(() => buildTypeMeta(terms), [terms])
  const [query, setQuery] = useState('')
  const debouncedQuery = useDebounce(query, 200)
  const [results, setResults] = useState<CairnSearchResult[]>([])
  const [recents, setRecents] = useState<StoredResult[]>([])
  const [pending, setPending] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const actionEntries = useMemo<ActionEntry[]>(() => {
    if (auth.user) {
      return [
        {
          id: 'sign-out',
          kind: 'action',
          label: 'Sign out',
          subtitle: auth.user.email,
          action: 'sign-out',
        },
      ]
    }
    return [
      {
        id: 'sign-in',
        kind: 'action',
        label: 'Sign in',
        subtitle: '/login',
        action: 'sign-in',
      },
    ]
  }, [auth.user])

  const displayEntries = useMemo<PaletteEntry[]>(() => {
    const q = query.trim()
    if (!q) {
      return [
        ...recents.map((r) => ({ kind: 'result' as const, ...r })),
        ...actionEntries,
      ]
    }
    const filteredActions = actionEntries.filter((entry) => {
      const hay = `${entry.label} ${entry.subtitle ?? ''}`.toLowerCase()
      return hay.includes(q.toLowerCase())
    })
    return [
      ...results.map((r) => ({ kind: 'result' as const, ...r })),
      ...filteredActions,
    ]
  }, [query, recents, results, actionEntries])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setResults([])
      setActiveIndex(0)
      setPending(false)
      return
    }
    setRecents(loadRecents())
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    if (!open) return
    const q = debouncedQuery.trim()
    if (!q) {
      setResults([])
      setPending(false)
      return
    }
    let cancelled = false
    setPending(true)
    void searchCairn(q, true)
      .then((next) => {
        if (!cancelled) setResults(next)
      })
      .catch(() => {
        if (!cancelled) setResults([])
      })
      .finally(() => {
        if (!cancelled) setPending(false)
      })
    return () => {
      cancelled = true
    }
  }, [debouncedQuery, open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, displayEntries.length])

  const selectEntry = useCallback(
    (entry: PaletteEntry) => {
      closeCommandPalette()
      if (entry.kind === 'action') {
        if (entry.action === 'sign-out') {
          auth.signOut()
          navigate('/login', { replace: true })
          return
        }
        navigate('/login')
        return
      }
      saveRecent(entry)
      navigate(entry.url)
    },
    [auth, closeCommandPalette, navigate],
  )

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeCommandPalette()
        return
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setActiveIndex((prev) =>
          displayEntries.length === 0 ? 0 : (prev + 1) % displayEntries.length,
        )
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) =>
          displayEntries.length === 0
            ? 0
            : (prev - 1 + displayEntries.length) % displayEntries.length,
        )
        return
      }
      if (e.key === 'Enter' && displayEntries[activeIndex]) {
        e.preventDefault()
        selectEntry(displayEntries[activeIndex])
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, displayEntries, activeIndex, closeCommandPalette, selectEntry])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-[260] flex items-start justify-center bg-black/40 p-3 pt-[10vh] sm:p-4 sm:pt-[12vh]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) closeCommandPalette()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        className="flex w-full max-w-xl flex-col overflow-hidden rounded-xl border border-border bg-card shadow-2xl"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search everything…"
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
          />
        </div>

        <div
          id="command-palette-results"
          role="listbox"
          className="max-h-[min(420px,50vh)] overflow-y-auto py-1"
        >
          {!query.trim() && recents.length > 0 ? (
            <div className="flex items-center gap-1.5 px-4 py-2">
              <Clock className="h-3 w-3 text-muted-foreground" aria-hidden />
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Recent
              </span>
            </div>
          ) : null}

          {query.trim() && pending ? (
            <div className="flex items-center justify-center py-10">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
            </div>
          ) : displayEntries.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query.trim()
                ? 'No results match your search.'
                : 'Start typing to search everything.'}
            </p>
          ) : (
            displayEntries.map((entry, index) => (
              <ResultRow
                key={entry.kind === 'action' ? entry.id : `${entry.type}:${entry.id}`}
                entry={entry}
                active={index === activeIndex}
                onSelect={() => selectEntry(entry)}
                typeMeta={typeMeta}
              />
            ))
          )}
        </div>

        <div className="hidden border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:block">
          <span>↑↓ navigate</span>
          <span className="mx-2">·</span>
          <span>↵ open</span>
          <span className="mx-2">·</span>
          <span>esc close</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}

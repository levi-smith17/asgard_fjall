import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { LogIn, LogOut, Search } from 'lucide-react'
import { Input } from '@/components/core/ui/input'
import { useCommandPalette } from '@/context/command-palette-context'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/hooks/use-terminology'
import { getFjallNavItems } from '@/lib/fjall-nav'
import { cn } from '@/lib/utils'

type SearchEntry = {
  id: string
  label: string
  subtitle?: string
  path?: string
  action?: 'sign-out' | 'sign-in'
  keywords?: string[]
}

function ResultRow({
  entry,
  active,
  onSelect,
}: {
  entry: SearchEntry
  active: boolean
  onSelect: () => void
}) {
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
      ) : null}
      {entry.action === 'sign-in' ? (
        <LogIn className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      ) : null}
    </button>
  )
}

export function CommandPaletteDialog() {
  const { open, closeCommandPalette } = useCommandPalette()
  const navigate = useNavigate()
  const auth = useAuth()
  const { terms } = useTerminology()
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const entries = useMemo<SearchEntry[]>(() => {
    const nav = getFjallNavItems(terms).map((item) => ({
      id: item.key,
      label: item.label,
      subtitle: item.href,
      path: item.href,
      keywords: [item.key, item.href],
    }))

    const actions: SearchEntry[] = auth.user
      ? [
          {
            id: 'sign-out',
            label: 'Sign out',
            subtitle: auth.user.email,
            action: 'sign-out',
            keywords: ['logout', 'signout', 'log out'],
          },
        ]
      : [
          {
            id: 'sign-in',
            label: 'Sign in',
            subtitle: '/login',
            path: '/login',
            action: 'sign-in',
            keywords: ['login', 'auth'],
          },
        ]

    return [...nav, ...actions]
  }, [auth.user, terms])

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return entries
    return entries.filter((entry) => {
      const haystack = [
        entry.label,
        entry.path,
        entry.subtitle,
        ...(entry.keywords ?? []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(q)
    })
  }, [entries, query])

  useEffect(() => {
    if (!open) {
      setQuery('')
      setActiveIndex(0)
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length])

  const selectResult = useCallback(
    (entry: SearchEntry) => {
      closeCommandPalette()
      if (entry.action === 'sign-out') {
        auth.signOut()
        navigate('/login', { replace: true })
        return
      }
      if (entry.path) navigate(entry.path)
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
        setActiveIndex((prev) => (results.length === 0 ? 0 : (prev + 1) % results.length))
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setActiveIndex((prev) =>
          results.length === 0 ? 0 : (prev - 1 + results.length) % results.length,
        )
        return
      }
      if (e.key === 'Enter' && results[activeIndex]) {
        e.preventDefault()
        selectResult(results[activeIndex])
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, results, activeIndex, closeCommandPalette, selectResult])

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
            placeholder="Search apps…"
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
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query.trim() ? 'No results match your search.' : 'Start typing to search.'}
            </p>
          ) : (
            results.map((entry, index) => (
              <ResultRow
                key={entry.id}
                entry={entry}
                active={index === activeIndex}
                onSelect={() => selectResult(entry)}
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

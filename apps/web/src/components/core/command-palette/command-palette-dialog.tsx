import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Search } from 'lucide-react'
import { Badge } from '@/components/core/ui/badge'
import { Input } from '@/components/core/ui/input'
import { useCommandPalette } from '@/context/command-palette-context'
import { useCommandSearchIndex, type CommandSearchEntry } from '@/hooks/use-command-search-index'
import { cn } from '@/lib/utils'

function ResultRow({
  entry,
  active,
  onSelect,
}: {
  entry: CommandSearchEntry
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
        <div className="flex items-center gap-1.5">
          <div className="truncate text-sm font-medium text-foreground">{entry.label}</div>
          {entry.externalUrl ? (
            <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" aria-hidden />
          ) : null}
        </div>
        {entry.subtitle ? (
          <div className="truncate text-xs text-muted-foreground">{entry.subtitle}</div>
        ) : null}
      </div>
      <div className="hidden shrink-0 flex-wrap items-center justify-end gap-1.5 pt-0.5 sm:flex">
        <Badge variant="muted" className="shrink-0">
          {entry.areaPill}
        </Badge>
        <Badge variant="default" className="shrink-0">
          {entry.productPill}
        </Badge>
      </div>
    </button>
  )
}

export function CommandPaletteDialog() {
  const { open, closeCommandPalette } = useCommandPalette()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [googleMode, setGoogleMode] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const { results, isIndexing, recordRecent, isShowingRecents } = useCommandSearchIndex(query)

  useEffect(() => {
    if (!open) {
      setQuery('')
      setGoogleMode(false)
      setActiveIndex(0)
      return
    }
    inputRef.current?.focus()
  }, [open])

  useEffect(() => {
    setActiveIndex(0)
  }, [query, results.length, googleMode])

  const selectResult = useCallback(
    (entry: CommandSearchEntry) => {
      recordRecent(entry)
      closeCommandPalette()
      if (entry.externalUrl && /^https?:\/\//i.test(entry.path)) {
        window.open(entry.externalUrl, '_blank', 'noopener,noreferrer')
        return
      }
      navigate(entry.path)
    },
    [closeCommandPalette, navigate, recordRecent],
  )

  const openExternalResult = useCallback(
    (entry: CommandSearchEntry) => {
      if (!entry.externalUrl) return
      recordRecent(entry)
      closeCommandPalette()
      window.open(entry.externalUrl, '_blank', 'noopener,noreferrer')
    },
    [closeCommandPalette, recordRecent],
  )

  const activeEntry = results[activeIndex] ?? null

  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'g') {
        e.preventDefault()
        setGoogleMode((value) => !value)
        return
      }
      if (e.key === 'Escape') {
        e.preventDefault()
        closeCommandPalette()
        return
      }
      if (googleMode) {
        if (e.key === 'Enter' && query.trim()) {
          e.preventDefault()
          window.open(
            `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`,
            '_blank',
            'noopener,noreferrer',
          )
          closeCommandPalette()
        }
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
        const entry = results[activeIndex]
        if (e.shiftKey && entry.externalUrl) openExternalResult(entry)
        else selectResult(entry)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [
    open,
    results,
    activeIndex,
    closeCommandPalette,
    selectResult,
    openExternalResult,
    googleMode,
    query,
  ])

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
        <div
          className={cn(
            'flex items-center gap-2 border-b px-4 py-3 transition-colors',
            googleMode ? 'border-blue-500/40 bg-blue-500/5' : 'border-border',
          )}
        >
          <Search
            className={cn(
              'h-4 w-4 shrink-0 transition-colors',
              googleMode ? 'text-blue-500' : 'text-muted-foreground',
            )}
            aria-hidden
          />
          <Input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={googleMode ? 'Search Google…' : 'Search everything…'}
            className="h-9 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
            aria-autocomplete="list"
            aria-controls="command-palette-results"
          />
          {googleMode ? (
            <span className="shrink-0 select-none rounded bg-blue-500/15 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
              Google
            </span>
          ) : null}
        </div>

        <div
          id="command-palette-results"
          role="listbox"
          className="max-h-[min(420px,50vh)] overflow-y-auto py-1"
        >
          {googleMode ? (
            <div className="flex flex-col items-center justify-center gap-2 px-4 py-12 text-center">
              {query.trim() ? (
                <p className="text-sm text-muted-foreground">
                  Press <kbd className="rounded bg-muted px-1 py-0.5 font-mono text-xs">↵</kbd> to
                  search Google for <strong>&quot;{query}&quot;</strong>
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">Type to search Google…</p>
              )}
            </div>
          ) : results.length === 0 && isIndexing ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">Loading…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              {query.trim()
                ? 'No results match your search.'
                : 'No recent results. Start typing to search.'}
            </p>
          ) : (
            <>
              {isShowingRecents ? (
                <p className="px-4 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Recent
                </p>
              ) : null}
              {results.map((entry, index) => (
                <ResultRow
                  key={entry.id}
                  entry={entry}
                  active={index === activeIndex}
                  onSelect={() => selectResult(entry)}
                />
              ))}
              {isIndexing && query.trim() ? (
                <p className="px-4 py-2 text-center text-xs text-muted-foreground">
                  Searching Fjall…
                </p>
              ) : null}
            </>
          )}
        </div>

        <div className="hidden border-t border-border bg-muted/20 px-4 py-2 text-[11px] text-muted-foreground sm:block">
          {googleMode ? (
            <>
              <span>↵ search Google</span>
              <span className="mx-2">·</span>
              <span>esc close</span>
              <span className="mx-2">·</span>
              <span className="text-blue-500/80">⌘G back to app</span>
            </>
          ) : (
            <>
              <span>↑↓ navigate</span>
              <span className="mx-2">·</span>
              <span>↵ open</span>
              {activeEntry?.externalUrl ? (
                <>
                  <span className="mx-2">·</span>
                  <span>⇧↵ external link</span>
                </>
              ) : null}
              <span className="mx-2">·</span>
              <span>esc close</span>
              <span className="mx-2">·</span>
              <span>⌘G Google</span>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

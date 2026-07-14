import { NotebookPen, Plus } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { FilterInput } from '@/components/core/ui/filter-input'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { ASGARD_ENTITY_ICONS } from '@/lib/asgard-entity-icons'
import type { SogurLogbook } from '@/lib/sogur-format'
import { cn } from '@/lib/utils'

function formatUpdatedAt(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

export function SogurRail({
  logbooks,
  selectedBookId,
  search,
  onSearchChange,
  onSelectBook,
  onNew,
  onOpenCatalog,
}: {
  logbooks: SogurLogbook[]
  selectedBookId: string | null
  search: string
  onSearchChange: (value: string) => void
  onSelectBook: (bookId: string, pageId?: string) => void
  onNew: () => void
  onOpenCatalog: () => void
}) {
  const terms = useTerms()
  const query = search.trim().toLowerCase()
  const filtered = query
    ? logbooks.filter(
        (book) =>
          book.name.toLowerCase().includes(query) ||
          book.logs.some(
            (log) =>
              log.title?.toLowerCase().includes(query) ||
              log.content.replace(/<[^>]*>/g, '').toLowerCase().includes(query),
          ),
      )
    : logbooks

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <StudioRailTitle icon={NotebookPen}>{terms.notes}</StudioRailTitle>
        <div className="flex items-center gap-1">
          <ToolbarTooltip label={`${terms.greinar} & ${terms.runir}`}>
            <button
              type="button"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              onClick={onOpenCatalog}
              aria-label={`${terms.greinar} & ${terms.runir}`}
            >
              <ASGARD_ENTITY_ICONS.greinar className="h-3.5 w-3.5" aria-hidden />
            </button>
          </ToolbarTooltip>
          <ToolbarTooltip label={`Add ${terms.notesSingular}`}>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="h-7 w-7"
              onClick={onNew}
              aria-label={`Add ${terms.notesSingular}`}
            >
              <Plus className="h-3.5 w-3.5" aria-hidden />
            </Button>
          </ToolbarTooltip>
        </div>
      </div>

      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <FilterInput
          value={search}
          onChange={onSearchChange}
          placeholder={`Filter ${terms.notes.toLowerCase()}…`}
          className="w-full"
        />
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-2 py-16 text-center">
            <p className="text-sm text-muted-foreground">
              {query
                ? `No ${terms.notes.toLowerCase()} match your filter.`
                : `No ${terms.notes.toLowerCase()} yet.`}
            </p>
            {!query ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Use + to create a {terms.notesSingular.toLowerCase()} on a{' '}
                {terms.greinSingular.toLowerCase()}.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-1.5">
            {filtered.map((book) => (
              <li key={book.id}>
                <button
                  type="button"
                  onClick={() => onSelectBook(book.id, book.logs[0]?.id)}
                  className={cn(
                    'flex w-full flex-col items-start gap-1 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
                    selectedBookId === book.id
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <div className="flex w-full items-center gap-2">
                    <span className="min-w-0 flex-1 truncate text-sm font-medium">{book.name}</span>
                    <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                      {book.pageCount}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Updated {formatUpdatedAt(book.updatedAt)}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}

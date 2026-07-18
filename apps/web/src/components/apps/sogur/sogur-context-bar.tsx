import {
  Bookmark,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  List,
  Loader2,
  NotebookPen,
  Save,
  Settings,
} from 'lucide-react'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { ContextBarSplitAddButton } from '@/components/core/ui/context-bar-add-button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/core/layout/studio-data-toolbar'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { Button } from '@/components/core/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

/** App header — restored top bar (search, pin, create). */
export function SogurContextBar({
  sagaCount,
  onNewThattr,
  onNewSaga,
  inspectorPinned,
  onInspectorPinnedChange,
  showInspectorPin,
}: {
  sagaCount?: number
  onNewThattr: () => void
  onNewSaga: () => void
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  showInspectorPin?: boolean
}) {
  const terms = useTerms()
  return (
    <StudioContextBar
      aria-label={`${terms.notes} header`}
      title={terms.notes}
      subtitle={`${terms.notesSingular} pages and journal entries`}
      metadata={
        sagaCount != null ? (
          <span className="shrink-0 rounded-full bg-primary/15 px-2 py-0.5 text-xs text-primary">
            {sagaCount}{' '}
            {sagaCount === 1 ? terms.notesSingular.toLowerCase() : terms.notes.toLowerCase()}
          </span>
        ) : null
      }
      actions={
        <>
          <GlobalSearchTrigger />
          {showInspectorPin ? (
            <ContextBarPinAndSync
              pinned={inspectorPinned}
              onPinnedChange={onInspectorPinnedChange}
            />
          ) : null}
          <ContextBarSplitAddButton
            label={`Add ${terms.thattrSingular}`}
            shortLabel={`Add ${terms.thattrSingular}`}
            onClick={onNewThattr}
            menuLabel="More create options"
            items={[
              {
                id: 'saga',
                label: `Add ${terms.notesSingular}`,
                icon: NotebookPen,
                onSelect: onNewSaga,
              },
            ]}
          />
        </>
      }
    />
  )
}

/** Document context bar under the header — max 56px. */
export function SogurDocumentBar({
  sagaName,
  thattrName,
  thaettir,
  activeThattrId,
  onSelectThattr,
  onPrevious,
  onNext,
  canPrevious,
  canNext,
  onOpenLauf,
  laufLabel,
  onSave,
  saving,
  saveDisabled,
  onInspectThattr,
}: {
  sagaName?: string | null
  /** Display title for the open Thattr; use a short placeholder when untitled. */
  thattrName?: string | null
  thaettir: Array<{ id: string; title: string }>
  activeThattrId?: string | null
  onSelectThattr: (id: string) => void
  onPrevious: () => void
  onNext: () => void
  canPrevious: boolean
  canNext: boolean
  onOpenLauf?: () => void
  laufLabel?: string | null
  onSave?: () => void
  saving?: boolean
  saveDisabled?: boolean
  /** Saga-owned Thattr only — opens the edit inspector. */
  onInspectThattr?: () => void
}) {
  const terms = useTerms()
  const activeIndex = thaettir.findIndex((thattr) => thattr.id === activeThattrId)
  const inSaga = Boolean(sagaName)
  const thattrOpen = Boolean(activeThattrId)
  // Pagination only inside a Saga with 2+ Thaettir while one is open.
  const showSwitcher = inSaga && thattrOpen && thaettir.length > 1
  const displayThattrName = thattrName?.trim() || '(no title)'

  return (
    <div className={STUDIO_CONTEXT_BAR_CLASS} role="toolbar" aria-label={`${terms.notes} context`}>
      <div className="flex w-full min-w-0 items-center justify-between gap-2 lg:grid lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center lg:gap-3">
        <div className="min-w-0 max-w-full justify-self-start overflow-hidden leading-tight lg:max-w-none">
          <p className="truncate text-sm font-medium text-foreground">
            {sagaName || (thattrOpen ? displayThattrName : terms.notesSingular)}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {sagaName && thattrOpen
              ? displayThattrName
              : sagaName
                ? `${thaettir.length} ${
                    thaettir.length === 1 ? terms.thattrSingular : terms.thaettir
                  }`
                : thattrOpen
                  ? `Standalone ${terms.thattrSingular.toLowerCase()}`
                  : terms.thaettir}
          </p>
        </div>

        {showSwitcher ? (
          <div className="flex shrink-0 items-center gap-0.5 lg:justify-self-center">
            <ToolbarTooltip label={`Previous ${terms.thattrSingular.toLowerCase()}`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!canPrevious}
                onClick={onPrevious}
                aria-label={`Previous ${terms.thattrSingular.toLowerCase()}`}
              >
                <ChevronLeft className="h-4 w-4" aria-hidden />
              </Button>
            </ToolbarTooltip>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 gap-1.5 px-2 text-xs"
                  aria-label={`Choose ${terms.thattrSingular.toLowerCase()}`}
                >
                  <List className="h-3.5 w-3.5" aria-hidden />
                  <span>
                    {activeIndex >= 0 ? activeIndex + 1 : '—'} / {thaettir.length}
                  </span>
                  <ChevronDown className="h-3 w-3 opacity-60" aria-hidden />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 overflow-hidden p-0" align="center">
                <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                  {terms.thaettir}
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {thaettir.map((thattr, index) => (
                    <button
                      key={thattr.id}
                      type="button"
                      onClick={() => onSelectThattr(thattr.id)}
                      className={cn(
                        'flex w-full items-center gap-2 border-b border-border px-3 py-2 text-left text-xs last:border-b-0 hover:bg-muted/50',
                        thattr.id === activeThattrId && 'bg-primary/10 text-primary',
                      )}
                    >
                      <span className="w-5 shrink-0 text-right tabular-nums text-muted-foreground">
                        {index + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {thattr.title.trim() || '(no title)'}
                      </span>
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <ToolbarTooltip label={`Next ${terms.thattrSingular.toLowerCase()}`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                disabled={!canNext}
                onClick={onNext}
                aria-label={`Next ${terms.thattrSingular.toLowerCase()}`}
              >
                <ChevronRight className="h-4 w-4" aria-hidden />
              </Button>
            </ToolbarTooltip>
          </div>
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}

        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:justify-self-end">
          {onOpenLauf ? (
            <ToolbarTooltip label={laufLabel ? `Open ${laufLabel}` : `Open ${terms.laufarSingular}`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-primary"
                onClick={onOpenLauf}
                aria-label={laufLabel ? `Open ${laufLabel}` : `Open ${terms.laufarSingular}`}
              >
                <Bookmark className="h-4 w-4" aria-hidden />
              </Button>
            </ToolbarTooltip>
          ) : null}
          {onSave ? (
            <ToolbarTooltip label="Save changes (⌘S)">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSave}
                disabled={saving || saveDisabled}
                aria-label="Save changes"
              >
                {saving ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Save className="h-4 w-4" aria-hidden />
                )}
              </Button>
            </ToolbarTooltip>
          ) : null}
          {onInspectThattr ? (
            <ToolbarTooltip label={`Edit ${terms.thattrSingular.toLowerCase()}`}>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onInspectThattr}
                aria-label={`Edit ${terms.thattrSingular.toLowerCase()}`}
              >
                <Settings className="h-4 w-4" aria-hidden />
              </Button>
            </ToolbarTooltip>
          ) : null}
        </div>
      </div>
    </div>
  )
}

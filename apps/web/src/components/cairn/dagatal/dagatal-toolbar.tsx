import { CalendarDays, Settings, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/core/ui/button'
import { StudioPaginationNav } from '@/components/core/ui/studio-pagination'
import { ToolbarMultiSelectDropdown } from '@/components/core/ui/toolbar-dropdown'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import type { CalendarMode } from '@/lib/luvi'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week' | 'day'

const MODE_OPTIONS: { value: CalendarMode; label: string; short: string; tip: string }[] = [
  { value: 'gregorian', label: 'Gregorian', short: 'G', tip: 'Standard Gregorian calendar' },
  { value: 'luvi', label: 'Luvi', short: 'L', tip: 'Gregorian calendar with Luvi date overlay' },
  { value: 'luvi-full', label: 'Full Luvi', short: 'L*', tip: 'Full Luvi calendar (14 months × 26 days)' },
]

export function DagatalToolbar({
  view,
  onViewChange,
  periodLabel,
  calendarMode,
  onCalendarModeChange,
  calendarOptions,
  selectedCalendarIds,
  onToggleCalendar,
  onPrev,
  onNext,
  onToday,
  eventsLoading,
  onReload,
}: {
  view: CalendarView
  onViewChange: (view: CalendarView) => void
  periodLabel: string
  calendarMode: CalendarMode
  onCalendarModeChange: (mode: CalendarMode) => void
  calendarOptions: { id: string; label: string }[]
  selectedCalendarIds: string[]
  onToggleCalendar: (id: string) => void
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  eventsLoading?: boolean
  onReload: () => void
}) {
  const navigate = useNavigate()
  const viewLabels: Record<CalendarView, string> = {
    month: 'Month',
    week: 'Week',
    day: 'Day',
  }

  const viewChips = (
    <div className="flex shrink-0 items-center divide-x divide-border overflow-hidden rounded-md border border-border text-xs">
      {(Object.entries(viewLabels) as [CalendarView, string][]).map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onViewChange(value)}
          className={cn(
            'px-2.5 py-1 transition-colors',
            view === value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )

  const modeChips = (
    <div className="flex shrink-0 items-center divide-x divide-border overflow-hidden rounded-md border border-border text-xs">
      {MODE_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          type="button"
          title={opt.tip}
          onClick={() => onCalendarModeChange(opt.value)}
          className={cn(
            'px-2.5 py-1 transition-colors',
            calendarMode === opt.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground',
          )}
        >
          <span className="hidden sm:inline">{opt.label}</span>
          <span className="sm:hidden">{opt.short}</span>
        </button>
      ))}
    </div>
  )

  const utilityActions = (
    <>
      {calendarOptions.length > 0 ? (
        <ToolbarMultiSelectDropdown
          values={selectedCalendarIds}
          options={calendarOptions}
          onToggle={onToggleCalendar}
          allLabel="All calendars"
          iconOnly
          menuAlign="end"
          icon={<CalendarDays className="h-4 w-4" />}
          ariaLabel="Calendars"
        />
      ) : null}
      <ToolbarTooltip label="Reload events">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
          onClick={onReload}
          disabled={eventsLoading}
          aria-label="Reload events"
        >
          <RefreshCw className={cn('h-4 w-4', eventsLoading && 'animate-spin')} />
        </button>
      </ToolbarTooltip>
      <ToolbarTooltip label="Dagatal settings">
        <button
          type="button"
          className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
          onClick={() => navigate(`/settings?section=dagatal`)}
          aria-label="Dagatal settings"
        >
          <Settings className="h-4 w-4" />
        </button>
      </ToolbarTooltip>
    </>
  )

  return (
    <div
      className={cn(
        'relative z-30 box-border flex shrink-0 flex-col gap-2 overflow-visible border-b border-border bg-context-bar px-3 py-2 sm:h-14 sm:min-h-14 sm:max-h-14 sm:flex-row sm:items-center sm:justify-between sm:gap-2 sm:px-6 sm:py-0 lg:px-8',
      )}
    >
      <div className="flex min-w-0 items-center gap-1">
        <StudioPaginationNav
          aria-label="Calendar period"
          onPrev={onPrev}
          onNext={onNext}
          prevLabel="Previous period"
          nextLabel="Next period"
        >
          <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={onToday}>
            Today
          </Button>
        </StudioPaginationNav>
        <p className="ml-1 min-w-0 flex-1 truncate text-xs font-medium text-foreground">{periodLabel}</p>
        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:hidden">{utilityActions}</div>
      </div>

      <div className="flex min-w-0 items-center gap-1.5 sm:justify-end">
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5 sm:flex-initial sm:flex-nowrap">
          {viewChips}
          {modeChips}
        </div>
        <div className="hidden shrink-0 items-center gap-1.5 sm:flex">{utilityActions}</div>
      </div>
    </div>
  )
}

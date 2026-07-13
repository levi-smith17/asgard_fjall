import { CalendarDays, Settings, RefreshCw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/core/ui/button'
import { STUDIO_CONTEXT_BAR_CLASS } from '@/components/core/layout/studio-data-toolbar'
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

  return (
    <div className={cn(STUDIO_CONTEXT_BAR_CLASS, 'justify-between gap-2')}>
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
        <p className="ml-1 min-w-0 truncate text-xs font-medium text-foreground">{periodLabel}</p>
      </div>

      <div className="flex min-w-0 shrink items-center justify-end gap-1.5">
        <div className="flex shrink-0 items-center divide-x divide-border overflow-hidden rounded-md border border-border text-xs">
          {(Object.entries(viewLabels) as [CalendarView, string][]).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => onViewChange(value)}
              className={`px-2.5 py-1 transition-colors ${view === value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex shrink-0 items-center divide-x divide-border overflow-hidden rounded-md border border-border text-xs">
          {MODE_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              title={opt.tip}
              onClick={() => onCalendarModeChange(opt.value)}
              className={`px-2.5 py-1 transition-colors ${calendarMode === opt.value ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted/40 hover:text-foreground'}`}
            >
              <span className="hidden sm:inline">{opt.label}</span>
              <span className="sm:hidden">{opt.short}</span>
            </button>
          ))}
        </div>
        {calendarOptions.length > 0 ? (
          <ToolbarMultiSelectDropdown
            values={selectedCalendarIds}
            options={calendarOptions}
            onToggle={onToggleCalendar}
            allLabel="All calendars"
            iconOnly
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
      </div>
    </div>
  )
}

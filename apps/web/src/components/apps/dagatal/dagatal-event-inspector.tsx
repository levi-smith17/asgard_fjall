import { Clock, FileText, MapPin } from 'lucide-react'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import type { DagatalEventSelection } from './dagatal-types'

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
}

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

export function DagatalEventInspector({ event }: { event: DagatalEventSelection }) {
  const timeLabel = event.allDay
    ? 'All day'
    : event.endDate
      ? `${formatTime(event.startDate)} – ${formatTime(event.endDate)}`
      : formatTime(event.startDate)

  const dateLabel =
    event.allDay && event.endDate && !isSameDay(event.startDate, event.endDate)
      ? `${formatDate(event.startDate)} – ${formatDate(event.endDate)}`
      : formatDate(event.startDate)

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Inspector" title="View Event" />
      </InspectorChrome>
      <div className="shrink-0 border-b border-border px-5 py-3">
        <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-5 py-4">
        <div className="flex items-start gap-2 text-sm text-muted-foreground">
          <Clock className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <div>{dateLabel}</div>
            <div>{timeLabel}</div>
          </div>
        </div>
        {event.location ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{event.location}</span>
          </div>
        ) : null}
        {event.notes ? (
          <div className="flex items-start gap-2 text-sm text-muted-foreground">
            <FileText className="mt-0.5 h-4 w-4 shrink-0" />
            <span className="whitespace-pre-wrap">{event.notes}</span>
          </div>
        ) : null}
      </div>
    </div>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Clock, FileText, MapPin } from 'lucide-react'
import { contrastColor } from '@/lib/color'

interface EventPopoverProps {
  title: string
  startDate: Date | string
  endDate: Date | string | null
  allDay: boolean
  location?: string | null
  notes?: string | null
  color: string
  children: React.ReactNode
}

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

function triggerRect(node: HTMLSpanElement | null): DOMRect | null {
  if (!node) return null
  const target = node.querySelector('button') ?? node.firstElementChild ?? node
  return target.getBoundingClientRect()
}

export function EventPopover({
  title,
  startDate: startRaw,
  endDate: endRaw,
  allDay,
  location,
  notes,
  color,
  children,
}: EventPopoverProps) {
  const [open, setOpen] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const triggerRef = useRef<HTMLSpanElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  const startDate = startRaw instanceof Date ? startRaw : new Date(startRaw)
  const endDate = endRaw ? (endRaw instanceof Date ? endRaw : new Date(endRaw)) : null

  const timeLabel = allDay
    ? 'All day'
    : endDate
      ? `${formatTime(startDate)} – ${formatTime(endDate)}`
      : formatTime(startDate)

  const dateLabel =
    allDay && endDate && !isSameDay(startDate, endDate)
      ? `${formatDate(startDate)} – ${formatDate(endDate)}`
      : formatDate(startDate)

  useLayoutEffect(() => {
    if (!open) return
    setAnchorRect(triggerRect(triggerRef.current))
  }, [open])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (
        !triggerRef.current?.contains(target) &&
        !popoverRef.current?.contains(target)
      ) {
        setOpen(false)
      }
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <span
        ref={triggerRef}
        className="contents"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((value) => !value)
        }}
      >
        {children}
      </span>
      {open && anchorRect
        ? createPortal(
            <div
              ref={popoverRef}
              className="fixed z-[200] w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg"
              style={{
                top: anchorRect.bottom + 4,
                left: Math.min(anchorRect.left, window.innerWidth - 272),
              }}
            >
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ backgroundColor: color, color: contrastColor(color) }}
              >
                <span className="min-w-0 flex-1 text-sm font-semibold leading-snug">{title}</span>
              </div>
              <div className="flex flex-col gap-2 p-3">
                <div className="flex items-start gap-2 text-xs text-muted-foreground">
                  <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  <div>
                    <div>{dateLabel}</div>
                    <div>{timeLabel}</div>
                  </div>
                </div>
                {location ? (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span>{location}</span>
                  </div>
                ) : null}
                {notes ? (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <FileText className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <span className="line-clamp-4">{notes}</span>
                  </div>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

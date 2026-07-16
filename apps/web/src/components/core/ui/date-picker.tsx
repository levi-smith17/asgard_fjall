import { useState } from 'react'
import { CalendarDays } from 'lucide-react'
import { Calendar } from '@/components/core/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import {
  formatDateInputValue,
  parseDateInputValue,
} from '@/lib/date-input'
import { cn } from '@/lib/utils'

function formatDisplayDate(value: string): string {
  const date = parseDateInputValue(value)
  if (!date) return 'Pick a date'
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  disabled = false,
  id,
  className,
}: {
  /** YYYY-MM-DD */
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  id?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const selected = parseDateInputValue(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={disabled}
          className={cn(
            'flex h-9 w-full min-w-0 max-w-full items-center justify-between gap-2 rounded-md border border-border bg-input px-3 text-left text-sm text-foreground shadow-sm transition-colors',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'hover:bg-muted/30 disabled:cursor-not-allowed disabled:opacity-60',
            !selected && 'text-muted-foreground',
            className,
          )}
        >
          <span className="min-w-0 truncate">{selected ? formatDisplayDate(value) : placeholder}</span>
          <CalendarDays className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start" side="top" sideOffset={6}>
        <Calendar
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            if (!date) return
            onChange(formatDateInputValue(date))
            setOpen(false)
          }}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

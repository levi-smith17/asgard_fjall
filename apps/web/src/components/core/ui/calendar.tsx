import { ChevronLeft, ChevronRight } from 'lucide-react'
import { DayPicker, type DayPickerProps } from 'react-day-picker'
import { buttonVariants } from '@/components/core/ui/button'
import { cn } from '@/lib/utils'

export type CalendarProps = DayPickerProps

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: cn('w-fit', classNames?.root),
        months: cn('relative flex flex-col gap-4 sm:flex-row', classNames?.months),
        month: cn('flex w-full flex-col gap-4', classNames?.month),
        month_caption: cn(
          'relative flex h-8 w-full items-center justify-center',
          classNames?.month_caption,
        ),
        caption_label: cn('text-sm font-medium', classNames?.caption_label),
        nav: cn('absolute inset-x-0 top-0 flex items-center justify-between', classNames?.nav),
        button_previous: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
          classNames?.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: 'outline', size: 'icon' }),
          'h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100',
          classNames?.button_next,
        ),
        month_grid: cn('w-full border-collapse', classNames?.month_grid),
        weekdays: cn('flex', classNames?.weekdays),
        weekday: cn(
          'w-9 text-[0.8rem] font-normal text-muted-foreground',
          classNames?.weekday,
        ),
        week: cn('mt-2 flex w-full', classNames?.week),
        day: cn(
          'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md [&:has([aria-selected])]:bg-accent',
          classNames?.day,
        ),
        day_button: cn(
          buttonVariants({ variant: 'ghost' }),
          'h-9 w-9 p-0 font-normal aria-selected:opacity-100',
          classNames?.day_button,
        ),
        selected: cn(
          'rounded-md bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground',
          classNames?.selected,
        ),
        today: cn('rounded-md bg-accent text-accent-foreground', classNames?.today),
        outside: cn(
          'text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground',
          classNames?.outside,
        ),
        disabled: cn('text-muted-foreground opacity-50', classNames?.disabled),
        hidden: cn('invisible', classNames?.hidden),
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) => {
          const Icon = orientation === 'left' ? ChevronLeft : ChevronRight
          return <Icon className="h-4 w-4" {...chevronProps} />
        },
        ...props.components,
      }}
      {...props}
    />
  )
}

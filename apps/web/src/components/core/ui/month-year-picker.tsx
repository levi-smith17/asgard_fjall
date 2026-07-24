import { useEffect, useMemo, useState } from 'react'
import { Select } from '@/components/core/ui/select'
import { toMonthInputValue } from '@/lib/date-input'
import { cn } from '@/lib/utils'

const MONTH_OPTIONS = [
  { value: '01', label: 'January' },
  { value: '02', label: 'February' },
  { value: '03', label: 'March' },
  { value: '04', label: 'April' },
  { value: '05', label: 'May' },
  { value: '06', label: 'June' },
  { value: '07', label: 'July' },
  { value: '08', label: 'August' },
  { value: '09', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
]

const CURRENT_YEAR = new Date().getFullYear()
const YEAR_OPTIONS = Array.from({ length: CURRENT_YEAR - 1950 + 6 }, (_, i) => {
  const year = String(CURRENT_YEAR + 5 - i)
  return { value: year, label: year }
})

function partsFromValue(value: string | null | undefined): { month: string; year: string } {
  const monthValue = toMonthInputValue(value)
  if (!monthValue || !/^\d{4}-\d{2}$/.test(monthValue)) return { month: '', year: '' }
  const [year, month] = monthValue.split('-')
  return { month, year }
}

/** Split Month + Year selects; emits YYYY-MM-01 when both are set, otherwise null. */
export function MonthYearPicker({
  value,
  onChange,
  disabled = false,
  className,
  monthPlaceholder = 'Month',
  yearPlaceholder = 'Year',
}: {
  value: string | null | undefined
  onChange: (value: string | null) => void
  disabled?: boolean
  className?: string
  monthPlaceholder?: string
  yearPlaceholder?: string
}) {
  const parsed = useMemo(() => partsFromValue(value), [value])
  const [month, setMonth] = useState(parsed.month)
  const [year, setYear] = useState(parsed.year)

  useEffect(() => {
    setMonth(parsed.month)
    setYear(parsed.year)
  }, [parsed.month, parsed.year])

  function commit(nextMonth: string, nextYear: string) {
    if (nextMonth && nextYear) {
      onChange(`${nextYear}-${nextMonth}-01`)
      return
    }
    onChange(null)
  }

  return (
    <div className={cn('flex min-w-0 gap-2', className)}>
      <Select
        className="min-w-0 flex-1"
        value={month}
        onChange={(next) => {
          setMonth(next)
          commit(next, year)
        }}
        options={MONTH_OPTIONS}
        placeholder={monthPlaceholder}
        disabled={disabled}
      />
      <Select
        className="min-w-0 flex-1"
        value={year}
        onChange={(next) => {
          setYear(next)
          commit(month, next)
        }}
        options={YEAR_OPTIONS}
        placeholder={yearPlaceholder}
        disabled={disabled}
      />
    </div>
  )
}

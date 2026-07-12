import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SelectOption = { value: string; label: string; description?: string; disabled?: boolean }

export type SelectProps = {
  options: SelectOption[]
  value?: string
  defaultValue?: string
  onChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  managed?: boolean
  className?: string
  id?: string
}

export function Select({ options, value: valueProp, defaultValue = '', onChange, placeholder = 'Select…', disabled = false, managed = false, className, id }: SelectProps) {
  const [open, setOpen] = React.useState(false)
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue)
  const rootRef = React.useRef<HTMLDivElement>(null)
  const isControlled = valueProp !== undefined
  const value = isControlled ? valueProp : uncontrolledValue
  const isDisabled = disabled || managed
  const selected = options.find((o) => o.value === value)

  const setValue = (next: string) => {
    if (!isControlled) setUncontrolledValue(next)
    onChange?.(next)
  }

  React.useEffect(() => {
    if (!open) return
    const onDoc = (event: MouseEvent) => { if (!rootRef.current?.contains(event.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  React.useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        id={id}
        type="button"
        disabled={isDisabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => { if (isDisabled) return; setOpen((c) => !c) }}
        className={cn(
          'flex h-9 w-full items-center justify-between gap-2 rounded-md border border-border bg-input px-3 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          isDisabled && 'cursor-not-allowed opacity-60',
          !isDisabled && 'hover:bg-muted/30',
        )}
      >
        <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>{selected?.label ?? placeholder}</span>
        <ChevronDown className={cn('h-4 w-4 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} />
      </button>
      {open && !isDisabled && (
        <ul role="listbox" className="absolute left-0 top-full z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-card py-1 shadow-lg">
          {options.map((option) => {
            const isSelected = option.value === value
            return (
              <li key={option.value} role="presentation">
                <button
                  id={`select-option-${id ?? 'list'}-${option.value}`}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  disabled={option.disabled}
                  onClick={() => { if (option.disabled) return; setValue(option.value); setOpen(false) }}
                  className={cn(
                    'flex w-full flex-col px-3 py-2 text-left text-sm transition-colors',
                    isSelected ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted-hover',
                    option.disabled && 'cursor-not-allowed opacity-50',
                  )}
                >
                  <span>{option.label}</span>
                  {option.description ? <span className="mt-0.5 text-xs font-normal text-muted-foreground">{option.description}</span> : null}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

import { useState } from 'react'
import { Check, ChevronRight, Search, User, X } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { cn } from '@/lib/utils'

export interface NidjatalKinPickerOption {
  value: string
  label: string
}

interface NidjatalKinPickerProps {
  value: string
  onChange: (id: string) => void
  options: NidjatalKinPickerOption[]
  placeholder?: string
  disabled?: boolean
  triggerClassName?: string
}

export function NidjatalKinPicker({
  value,
  onChange,
  options,
  placeholder = 'Select person…',
  disabled = false,
  triggerClassName,
}: NidjatalKinPickerProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')

  const q = search.toLowerCase()
  const filtered = q ? options.filter((o) => o.value === '' || o.label.toLowerCase().includes(q)) : options

  const selectedLabel = options.find((o) => o.value === value)?.label

  function handleSelect(id: string) {
    onChange(id)
    setOpen(false)
    setSearch('')
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSearch('')
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          disabled={disabled}
          className={cn('h-9 md:h-8 gap-1.5 text-sm justify-start', triggerClassName)}
        >
          <User className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className={cn('flex-1 text-left truncate', !value && 'text-muted-foreground')}>
            {value ? selectedLabel ?? placeholder : (options.find((o) => o.value === '')?.label ?? placeholder)}
          </span>
          <ChevronRight className="h-3 w-3 shrink-0 rotate-90 text-muted-foreground" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0" align="start">
        <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            autoFocus
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            autoComplete="off"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : null}
        </div>
        <div className="max-h-56 overflow-y-auto py-1">
          {filtered.length > 0 ? (
            filtered.map((option) => (
              <button
                key={option.value}
                type="button"
                className={cn(
                  'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
                  option.value === value ? 'bg-primary/15' : 'hover:bg-muted/60',
                  option.value === '' && 'italic text-muted-foreground',
                )}
                onClick={() => handleSelect(option.value)}
              >
                <span className="flex w-3.5 shrink-0 items-center justify-center">
                  {option.value === value ? <Check className="h-3 w-3" /> : null}
                </span>
                {option.label}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-center text-sm text-muted-foreground">No results.</p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}

import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type ToolbarDropdownOption = { id: string; label: string }

type ToolbarDropdownProps = {
  value: string
  options: ToolbarDropdownOption[]
  onChange: (id: string) => void
  className?: string
  fullWidth?: boolean
  menuAlign?: 'start' | 'end'
  iconOnly?: boolean
  icon?: React.ReactNode
  ariaLabel?: string
}

export function ToolbarDropdown({ value, options, onChange, className, fullWidth, menuAlign = 'start', iconOnly, icon, ariaLabel }: ToolbarDropdownProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number; minWidth: number } | null>(null)
  const selected = options.find((o) => o.id === value)

  useLayoutEffect(() => {
    if (!open) { setMenuPos(null); return }
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const minWidth = Math.max(rect.width, 144)
      const left = menuAlign === 'end' ? rect.right - minWidth : rect.left
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, left), minWidth })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [open, menuAlign])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const menu = open && menuPos ? createPortal(
    <div ref={menuRef} role="listbox" data-studio-portal className="fixed z-50 overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg" style={{ top: menuPos.top, left: menuPos.left, minWidth: menuPos.minWidth }}>
      {options.map((option) => (
        <button key={option.id} type="button" role="option" aria-selected={option.id === value} onClick={() => { onChange(option.id); setOpen(false) }}
          className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors', option.id === value ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted-hover')}>
          <Check className={cn('h-3 w-3 shrink-0', option.id === value ? 'opacity-100' : 'opacity-0')} />
          {option.label}
        </button>
      ))}
    </div>,
    document.body,
  ) : null

  return (
    <div ref={rootRef} className={cn('relative inline-flex', fullWidth && 'w-full', className)}>
      <button ref={triggerRef} type="button" onClick={() => setOpen((c) => !c)}
        className={cn('inline-flex h-8 items-center rounded-md border border-border bg-input text-xs font-medium text-foreground transition-colors hover:bg-muted-hover', iconOnly ? 'w-8 justify-center px-0' : fullWidth ? 'w-full justify-between gap-1.5 px-2.5' : 'max-w-[12rem] gap-1.5 px-2.5', iconOnly && value !== options[0]?.id && 'border-primary/40 bg-primary/10 text-primary')}
        aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel ?? selected?.label ?? 'Select…'}>
        {iconOnly ? (icon ?? <ChevronDown className="h-3.5 w-3.5" />) : (
          <>
            {icon ? <span className="shrink-0 text-muted-foreground">{icon}</span> : null}
            <span className="min-w-0 flex-1 truncate text-left">{selected?.label ?? 'Select…'}</span>
            <ChevronDown className={cn('h-3 w-3 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} />
          </>
        )}
      </button>
      {menu}
    </div>
  )
}

type MultiSelectProps = {
  values: string[]
  options: ToolbarDropdownOption[]
  onToggle: (id: string) => void
  allLabel?: string
  className?: string
  fullWidth?: boolean
  menuAlign?: 'start' | 'end'
  iconOnly?: boolean
  icon?: React.ReactNode
  ariaLabel?: string
}

export function ToolbarMultiSelectDropdown({ values, options, onToggle, allLabel = 'All', className, fullWidth, menuAlign = 'end', iconOnly, icon, ariaLabel }: MultiSelectProps) {
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const partial = values.length > 0 && values.length < options.length
  const label = values.length === options.length || values.length === 0 ? allLabel : values.length === 1 ? (options.find((o) => o.id === values[0])?.label ?? '1 selected') : `${values.length} selected`

  useLayoutEffect(() => {
    if (!open) { setMenuPos(null); return }
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const width = Math.max(rect.width, 160)
      const left = menuAlign === 'end' ? rect.right - width : rect.left
      setMenuPos({ top: rect.bottom + 4, left: Math.max(8, Math.min(left, window.innerWidth - width - 8)) })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => { window.removeEventListener('resize', update); window.removeEventListener('scroll', update, true) }
  }, [open, menuAlign])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const target = e.target as Node
      if (rootRef.current?.contains(target) || menuRef.current?.contains(target)) return
      setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const menu = open && menuPos ? createPortal(
    <div ref={menuRef} role="listbox" aria-multiselectable="true" data-studio-portal className="fixed z-50 min-w-[8.5rem] overflow-hidden rounded-md border border-border bg-card py-0.5 shadow-lg" style={{ top: menuPos.top, left: menuPos.left }}>
      {options.map((option) => {
        const checked = values.includes(option.id)
        return (
          <button key={option.id} type="button" role="option" aria-selected={checked} onClick={() => onToggle(option.id)}
            className={cn('flex w-full items-center gap-2 px-2.5 py-1.5 text-left text-xs transition-colors', checked ? 'bg-primary/10 font-medium text-primary' : 'text-foreground hover:bg-muted-hover')}>
            <Check className={cn('h-3 w-3 shrink-0', checked ? 'opacity-100' : 'opacity-0')} aria-hidden />
            <span className="whitespace-nowrap">{option.label}</span>
          </button>
        )
      })}
    </div>,
    document.body,
  ) : null

  return (
    <div ref={rootRef} className={cn('relative inline-flex', fullWidth && 'w-full', className)}>
      <button ref={triggerRef} type="button" onClick={() => setOpen((c) => !c)}
        className={cn('inline-flex h-8 items-center rounded-md text-xs font-medium transition-colors', iconOnly ? cn('w-8 justify-center px-0 text-muted-foreground hover:bg-muted-hover hover:text-foreground', partial && 'bg-primary/15 text-primary hover:bg-primary/20 hover:text-primary') : fullWidth ? 'w-full justify-between gap-1.5 border border-border bg-input px-2.5 text-foreground hover:bg-muted-hover' : 'max-w-[11rem] gap-1.5 border border-border bg-input px-2.5 text-foreground hover:bg-muted-hover')}
        aria-haspopup="listbox" aria-expanded={open} aria-label={ariaLabel ?? label}>
        {iconOnly ? (icon ?? <ChevronDown className="h-3.5 w-3.5" />) : (
          <><span className="truncate">{label}</span><ChevronDown className={cn('h-3 w-3 shrink-0 opacity-70 transition-transform', open && 'rotate-180')} /></>
        )}
      </button>
      {menu}
    </div>
  )
}

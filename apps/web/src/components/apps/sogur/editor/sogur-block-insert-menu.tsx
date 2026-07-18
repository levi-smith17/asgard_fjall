import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Code2,
  Heading2,
  ImageIcon,
  Minus,
  Pilcrow,
  Quote,
  type LucideIcon,
} from 'lucide-react'
import type { SogurBlockType } from '@/lib/sogur-blocks'

const options: Array<{
  type: SogurBlockType
  label: string
  description: string
  icon: LucideIcon
}> = [
  { type: 'rich-text', label: 'Text', description: 'Rich text and lists', icon: Pilcrow },
  { type: 'heading', label: 'Heading', description: 'Section heading', icon: Heading2 },
  { type: 'quote', label: 'Quote', description: 'Highlighted quotation', icon: Quote },
  { type: 'code', label: 'Code', description: 'Code block', icon: Code2 },
  { type: 'divider', label: 'Divider', description: 'Horizontal separator', icon: Minus },
  { type: 'image', label: 'Image', description: 'Image from a URL', icon: ImageIcon },
]

export function SogurBlockInsertMenu({
  onSelect,
  onClose,
}: {
  onSelect: (type: SogurBlockType) => void
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return options
    return options.filter(
      (option) =>
        option.label.toLowerCase().includes(term) ||
        option.description.toLowerCase().includes(term),
    )
  }, [query])

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      ref={rootRef}
      data-sogur-insert-menu
      className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="flex items-center gap-2 border-b border-border px-3 py-2">
        <span className="font-mono text-sm text-muted-foreground">/</span>
        <input
          ref={inputRef}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && filtered[0]) {
              event.preventDefault()
              onSelect(filtered[0].type)
            }
          }}
          placeholder="Filter block types…"
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <ul className="max-h-72 overflow-y-auto py-1" role="listbox">
        {filtered.map((option) => {
          const Icon = option.icon
          return (
            <li key={option.type}>
              <button
                type="button"
                role="option"
                className="flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted"
                onClick={() => onSelect(option.type)}
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.description}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {!filtered.length && (
          <li className="px-3 py-3 text-sm text-muted-foreground">No matching blocks</li>
        )}
      </ul>
    </div>
  )
}

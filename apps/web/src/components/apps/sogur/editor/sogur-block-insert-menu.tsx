import { useEffect, useMemo, useRef } from 'react'
import type { Editor } from '@tiptap/react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export type SogurSlashCommand = {
  id: string
  label: string
  description: string
  icon: LucideIcon
  keywords?: string[]
  run: (editor: Editor) => void
}

export function SogurBlockInsertMenu({
  commands,
  query = '',
  onSelect,
  onClose,
}: {
  commands: SogurSlashCommand[]
  query?: string
  onSelect: (command: SogurSlashCommand) => void
  onClose: () => void
}) {
  const rootRef = useRef<HTMLDivElement>(null)
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase()
    if (!term) return commands
    return commands.filter(
      (command) =>
        command.label.toLowerCase().includes(term) ||
        command.description.toLowerCase().includes(term) ||
        command.keywords?.some((keyword) => keyword.includes(term)),
    )
  }, [commands, query])

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) onClose()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
      if (event.key === 'Enter' && filtered[0]) {
        event.preventDefault()
        event.stopPropagation()
        onSelect(filtered[0])
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown, true)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown, true)
    }
  }, [filtered, onClose, onSelect])

  return (
    <div
      ref={rootRef}
      data-sogur-insert-menu
      className="w-72 overflow-hidden rounded-lg border border-border bg-card shadow-xl"
      onPointerDown={(event) => event.stopPropagation()}
    >
      <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
        {query ? `/${query}` : 'Insert block'}
      </div>
      <ul className="max-h-80 overflow-y-auto py-1" role="listbox">
        {filtered.map((command) => {
          const Icon = command.icon
          return (
            <li key={command.id}>
              <button
                type="button"
                role="option"
                className={cn(
                  'flex w-full items-center gap-3 px-3 py-2 text-left hover:bg-muted',
                )}
                onClick={() => onSelect(command)}
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-muted/40">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{command.label}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {command.description}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
        {!filtered.length ? (
          <li className="px-3 py-3 text-sm text-muted-foreground">No matching blocks</li>
        ) : null}
      </ul>
    </div>
  )
}

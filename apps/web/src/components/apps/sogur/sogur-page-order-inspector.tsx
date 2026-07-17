import { useMemo } from 'react'
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Check, GripVertical } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { reorderFjallLogs, type FjallLogView } from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { pagePreview } from '@/lib/sogur-format'
import { cn } from '@/lib/utils'

function SortablePageRow({
  log,
  index,
  isActive,
  onSelect,
}: {
  log: FjallLogView
  index: number
  isActive: boolean
  onSelect: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: log.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'flex items-center gap-2 border-b border-border px-4 py-3 text-sm transition-colors',
        isDragging && 'opacity-50',
        isActive && 'bg-primary/10',
      )}
    >
      <button
        type="button"
        className="cursor-grab touch-none text-muted-foreground/40 hover:text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
        {index + 1}
      </span>
      <button type="button" onClick={onSelect} className="min-w-0 flex-1 text-left">
        <p className={cn('truncate', log.title ? 'font-medium' : 'text-muted-foreground')}>
          {pagePreview(log)}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {new Date(log.createdAt).toLocaleDateString()}
        </p>
      </button>
      {isActive ? <Check className="h-3.5 w-3.5 shrink-0 text-primary" /> : null}
    </div>
  )
}

export function SogurPageOrderInspector({
  logs,
  activePageId,
  bookName,
  onLogsChange,
  onSelectPage,
  onClose,
}: {
  logs: FjallLogView[]
  activePageId: string | null
  bookName: string
  onLogsChange: (logs: FjallLogView[]) => void
  onSelectPage: (pageId: string) => void
  onClose?: () => void
}) {
  const terms = useTerms()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ids = useMemo(() => logs.map((log) => log.id), [logs])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = logs.findIndex((log) => log.id === active.id)
    const newIndex = logs.findIndex((log) => log.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return

    const next = arrayMove(logs, oldIndex, newIndex)
    onLogsChange(next)
    try {
      await reorderFjallLogs(next.map((log) => log.id))
    } catch {
      onLogsChange(logs)
    }
  }

  return (
    <div className="flex h-full min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Page order" title={bookName} />
      </InspectorChrome>

      <p className="shrink-0 border-b border-border px-5 py-3 text-xs text-muted-foreground">
        Drag pages to reorder this {terms.notesSingular.toLowerCase()}.
      </p>

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto overflow-x-hidden">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {logs.map((log, index) => (
              <SortablePageRow
                key={log.id}
                log={log}
                index={index}
                isActive={log.id === activePageId}
                onSelect={() => onSelectPage(log.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
      </div>

      {onClose ? (
        <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-4">
          <Button type="button" size="sm" variant="outline" className="w-full" onClick={onClose}>
            Done
          </Button>
        </div>
      ) : null}
    </div>
  )
}

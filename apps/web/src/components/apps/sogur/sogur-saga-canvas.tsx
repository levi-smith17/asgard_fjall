import { useEffect, useMemo, useState } from 'react'
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
  rectSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Settings, StickyNote } from 'lucide-react'
import { MarkerColorSwatch } from '@/components/apps/markers-list'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'
import type { SogurRailMarker } from './sogur-rail'

export type SogurSagaCanvasThattr = {
  id: string
  title: string
  preview: string
  markers: SogurRailMarker[]
}

function SortableThattrCard({
  thattr,
  onOpen,
  onInspect,
}: {
  thattr: SogurSagaCanvasThattr
  onOpen: () => void
  onInspect: () => void
}) {
  const terms = useTerms()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: thattr.id,
  })

  return (
    <article
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        'group flex min-h-32 w-64 flex-col rounded-xl border border-border bg-card p-3 shadow-sm transition-colors hover:border-primary/50',
        isDragging && 'z-10 opacity-60 shadow-lg',
      )}
    >
      <div className="flex items-start gap-1">
        <button
          type="button"
          onClick={onOpen}
          className="min-w-0 flex-1 text-left"
        >
          <span className="flex items-center gap-1.5">
            <StickyNote className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
            <span className="truncate text-sm font-semibold">{thattr.title}</span>
          </span>
        </button>
        <ToolbarTooltip label={`Move ${terms.thattrSingular.toLowerCase()}`}>
          <button
            type="button"
            className="touch-none rounded p-1 text-muted-foreground/50 hover:bg-muted hover:text-muted-foreground"
            aria-label={`Move ${thattr.title}`}
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-3.5 w-3.5" aria-hidden />
          </button>
        </ToolbarTooltip>
        <ToolbarTooltip label={`Edit ${terms.thattrSingular.toLowerCase()}`}>
          <button
            type="button"
            onClick={onInspect}
            className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            aria-label={`Edit ${thattr.title}`}
          >
            <Settings className="h-3.5 w-3.5" aria-hidden />
          </button>
        </ToolbarTooltip>
      </div>

      {thattr.markers.length > 0 ? (
        <div className="mt-2 flex flex-wrap gap-1">
          {thattr.markers.slice(0, 4).map((marker) => (
            <span
              key={marker.id}
              className="inline-flex items-center gap-1 rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              <MarkerColorSwatch color={marker.color} />
              {marker.name.split('/').pop()}
            </span>
          ))}
        </div>
      ) : null}

      <button
        type="button"
        onClick={onOpen}
        className="mt-2 line-clamp-3 min-h-0 flex-1 text-left text-xs leading-relaxed text-muted-foreground"
      >
        {thattr.preview || `Empty ${terms.thattrSingular.toLowerCase()}`}
      </button>
    </article>
  )
}

export function SogurSagaCanvas({
  sagaName,
  thaettir,
  onOpenThattr,
  onInspectThattr,
  onReorder,
}: {
  sagaName: string
  thaettir: SogurSagaCanvasThattr[]
  onOpenThattr: (id: string) => void
  onInspectThattr: (id: string) => void
  onReorder: (orderedIds: string[]) => Promise<void>
}) {
  const terms = useTerms()
  const [ordered, setOrdered] = useState(thaettir)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  useEffect(() => setOrdered(thaettir), [thaettir])
  const ids = useMemo(() => ordered.map((thattr) => thattr.id), [ordered])

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = ordered.findIndex((thattr) => thattr.id === active.id)
    const to = ordered.findIndex((thattr) => thattr.id === over.id)
    if (from < 0 || to < 0) return
    const previous = ordered
    const next = arrayMove(ordered, from, to)
    setOrdered(next)
    try {
      await onReorder(next.map((thattr) => thattr.id))
    } catch {
      setOrdered(previous)
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-background">
      <div className="shrink-0 border-b border-border px-6 py-4">
        <h2 className="truncate text-lg font-semibold">{sagaName}</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {ordered.length} {ordered.length === 1 ? terms.thattrSingular : terms.thaettir}
        </p>
      </div>
      <div className="min-h-0 flex-1 overflow-auto px-6 py-6">
        {ordered.length === 0 ? (
          <div className="flex min-h-52 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
            This {terms.notesSingular.toLowerCase()} has no {terms.thaettir.toLowerCase()} yet.
          </div>
        ) : (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={ids} strategy={rectSortingStrategy}>
              <div className="grid auto-cols-[16rem] grid-flow-col grid-rows-5 gap-3">
                {ordered.map((thattr) => (
                  <SortableThattrCard
                    key={thattr.id}
                    thattr={thattr}
                    onOpen={() => onOpenThattr(thattr.id)}
                    onInspect={() => onInspectThattr(thattr.id)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>
    </div>
  )
}

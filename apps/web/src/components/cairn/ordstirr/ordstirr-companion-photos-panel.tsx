import { useEffect, useMemo, useRef, useState } from 'react'
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
import { GripVertical, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import {
  deleteManifestCompanionMedia,
  saveManifestCompanionMedia,
  uploadManifestCompanionMedia,
  type ManifestCompanionMedia,
} from '@/lib/manifest-api'
import { publicCompanionMediaUrl } from '@/lib/public-media-url'
import { cn } from '@/lib/utils'

function SortableMediaCard({
  item,
  name,
  onCaptionBlur,
  onDelete,
}: {
  item: ManifestCompanionMedia
  name: string
  onCaptionBlur: (caption: string | null) => void
  onDelete: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  })

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
      className={cn(
        'rounded-lg border border-border bg-card p-2',
        isDragging && 'opacity-60 shadow-md',
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          className="mt-2 cursor-grab touch-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing"
          aria-label="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="relative aspect-square w-full overflow-hidden rounded-md bg-muted">
            {item.type === 'VIDEO' ? (
              <video
                src={publicCompanionMediaUrl(item.key)}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            ) : (
              <img
                src={publicCompanionMediaUrl(item.key)}
                alt={item.caption ?? name}
                className="h-full w-full object-cover"
              />
            )}
            <ToolbarTooltip label="Remove">
              <button
                type="button"
                onClick={onDelete}
                className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-md bg-background/90 text-destructive shadow-sm backdrop-blur-sm transition-colors hover:bg-destructive hover:text-destructive-foreground"
                aria-label="Remove photo"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </ToolbarTooltip>
          </div>
          <Input
            defaultValue={item.caption ?? ''}
            placeholder="Caption (optional)"
            className="h-8 text-xs"
            onBlur={(event) => {
              const caption = event.target.value.trim() || null
              if (caption !== (item.caption ?? null)) onCaptionBlur(caption)
            }}
          />
        </div>
      </div>
    </div>
  )
}

export function OrdstirrCompanionPhotosPanel({
  companionId,
  name,
  media,
  onMediaChange,
  disabled,
}: {
  companionId: string
  name: string
  media: ManifestCompanionMedia[]
  onMediaChange: (media: ManifestCompanionMedia[]) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  const ordered = useMemo(
    () => [...media].sort((a, b) => a.order - b.order),
    [media],
  )
  const ids = useMemo(() => ordered.map((item) => item.id), [ordered])

  useEffect(() => {
    if (inputRef.current) inputRef.current.value = ''
  }, [ordered.length])

  async function persist(next: ManifestCompanionMedia[]) {
    const normalized = next.map((item, index) => ({ ...item, order: index }))
    onMediaChange(normalized)
    try {
      await saveManifestCompanionMedia(companionId, normalized)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update photos')
      throw error
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = ordered.findIndex((item) => item.id === active.id)
    const newIndex = ordered.findIndex((item) => item.id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const previous = ordered
    try {
      await persist(arrayMove(ordered, oldIndex, newIndex))
    } catch {
      onMediaChange(previous)
    }
  }

  async function handleUpload(file: File) {
    setUploading(true)
    try {
      const uploaded = await uploadManifestCompanionMedia(file, companionId, ordered.length)
      const next = [
        ...ordered,
        {
          id: uploaded.mediaId,
          key: uploaded.key,
          type: uploaded.type,
          caption: null,
          order: ordered.length,
        },
      ]
      onMediaChange(next)
      toast.success('Photo added')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload photo')
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(mediaId: string) {
    const previous = ordered
    const next = ordered.filter((item) => item.id !== mediaId)
    onMediaChange(next.map((item, index) => ({ ...item, order: index })))
    try {
      await deleteManifestCompanionMedia({ companionId, mediaId })
      toast.success('Photo removed')
    } catch (error) {
      onMediaChange(previous)
      toast.error(error instanceof Error ? error.message : 'Failed to remove photo')
    }
  }

  if (disabled) {
    return (
      <p className="text-sm text-muted-foreground">
        Save this companion first, then you can add photos and videos.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-2">
        <p className="min-w-0 text-xs text-muted-foreground">
          Drag to reorder. Photos appear on Ferd Min.
        </p>
        <ToolbarTooltip label={uploading ? 'Uploading…' : 'Add photo or video'}>
          <Button
            type="button"
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            disabled={uploading}
            onClick={() => inputRef.current?.click()}
            aria-label="Add photo or video"
          >
            <Plus className="h-4 w-4" />
          </Button>
        </ToolbarTooltip>
        <input
          ref={inputRef}
          type="file"
          accept="image/*,video/mp4,video/quicktime,video/webm"
          className="hidden"
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) void handleUpload(file)
          }}
        />
      </div>

      {ordered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border px-3 py-8 text-center text-sm text-muted-foreground">
          No photos yet.
        </p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={(e) => void handleDragEnd(e)}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {ordered.map((item) => (
                <SortableMediaCard
                  key={item.id}
                  item={item}
                  name={name}
                  onCaptionBlur={(caption) => {
                    void persist(
                      ordered.map((entry) =>
                        entry.id === item.id ? { ...entry, caption } : entry,
                      ),
                    )
                  }}
                  onDelete={() => void handleDelete(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  )
}

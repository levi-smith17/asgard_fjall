'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  type DragEndEvent,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from '@tiptap/extension-image'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import { EditorContent, type Editor, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { GripVertical, ImageIcon, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  createSogurBlock,
  parseSogurBlocks,
  serializeSogurBlocks,
  type SogurBlock,
  type SogurBlockType,
} from '@/lib/sogur-blocks'
import { SogurBlockInsertMenu } from './sogur-block-insert-menu'
import { SogurBlockToolbar } from './sogur-block-toolbar'

export type SogurBlockEditorProps = {
  value: string
  onChange: (serialized: string) => void
  onImageUpload?: (file: File) => Promise<string>
  className?: string
}

function TextBlockEditor({
  block,
  onChange,
  onFocus,
  onDestroy,
  onSlashInsert,
}: {
  block: Extract<SogurBlock, { type: 'rich-text' | 'heading' | 'quote' | 'code' }>
  onChange: (content: string) => void
  onFocus: (editor: Editor) => void
  onDestroy: (editor: Editor) => void
  onSlashInsert: () => void
}) {
  const onChangeRef = useRef(onChange)
  const onFocusRef = useRef(onFocus)
  const onDestroyRef = useRef(onDestroy)
  const onSlashInsertRef = useRef(onSlashInsert)
  onChangeRef.current = onChange
  onFocusRef.current = onFocus
  onDestroyRef.current = onDestroy
  onSlashInsertRef.current = onSlashInsert

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: block.type === 'heading' ? { levels: [1, 2, 3] } : false,
        bulletList: block.type === 'rich-text' ? {} : false,
        orderedList: block.type === 'rich-text' ? {} : false,
        listItem: block.type === 'rich-text' ? {} : false,
        horizontalRule: false,
      }),
      Underline,
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder:
          block.type === 'heading'
            ? 'Section heading…'
            : block.type === 'quote'
              ? 'Quote…'
              : block.type === 'code'
                ? 'Code…'
                : "Write, or press '/' for blocks…",
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    [block.type],
  )

  const editor = useEditor(
    {
      immediatelyRender: false,
      extensions,
      content: block.content,
      onUpdate: ({ editor: activeEditor }) => onChangeRef.current(activeEditor.getHTML()),
      onFocus: ({ editor: activeEditor }) => onFocusRef.current(activeEditor),
      editorProps: {
        attributes: {
          class: cn(
            'tiptap min-h-7 w-full outline-none',
            'prose max-w-none prose-neutral dark:prose-invert',
            'prose-p:my-1 prose-li:my-0 prose-img:rounded-lg',
            block.type === 'heading' &&
              'prose-headings:my-0 prose-headings:text-3xl prose-headings:font-semibold',
            block.type === 'quote' && 'prose-blockquote:my-0 prose-blockquote:text-lg',
            block.type === 'code' && 'prose-pre:my-0 prose-pre:rounded-lg',
          ),
        },
        handleKeyDown: (view, event) => {
          if (event.key !== '/' || event.metaKey || event.ctrlKey || event.altKey) return false
          const { $from } = view.state.selection
          const before = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
          if (before.length > 0 && !/\s$/.test(before)) return false
          event.preventDefault()
          onSlashInsertRef.current()
          return true
        },
      },
    },
    [block.type],
  )

  useEffect(() => {
    if (!editor || editor.getHTML() === block.content) return
    editor.commands.setContent(block.content, { emitUpdate: false })
  }, [block.content, editor])

  useEffect(() => {
    if (!editor) return
    return () => onDestroyRef.current(editor)
  }, [editor])

  return editor ? <EditorContent editor={editor} /> : <div className="h-8 animate-pulse rounded bg-muted" />
}

function ImageBlockEditor({
  block,
  onChange,
  onFocus,
}: {
  block: Extract<SogurBlock, { type: 'image' }>
  onChange: (block: Extract<SogurBlock, { type: 'image' }>) => void
  onFocus: () => void
}) {
  return (
    <div className="space-y-3">
      {block.src ? (
        <img
          src={block.src}
          alt={block.alt}
          className="max-h-[32rem] w-full rounded-lg border border-border object-contain"
        />
      ) : (
        <div className="flex h-48 items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-muted-foreground">
          <ImageIcon className="h-8 w-8" />
        </div>
      )}
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          type="url"
          value={block.src}
          placeholder="Image URL"
          aria-label="Image URL"
          onFocus={onFocus}
          onChange={(event) => onChange({ ...block, src: event.target.value })}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
        <input
          value={block.alt}
          placeholder="Alt text"
          aria-label="Image alt text"
          onFocus={onFocus}
          onChange={(event) => onChange({ ...block, alt: event.target.value })}
          className="h-9 rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
        />
      </div>
      <input
        value={block.caption ?? ''}
        placeholder="Caption (optional)"
        aria-label="Image caption"
        onFocus={onFocus}
        onChange={(event) => onChange({ ...block, caption: event.target.value })}
        className="h-9 w-full rounded-md border border-border bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
      />
    </div>
  )
}

function SortableSogurBlock({
  block,
  index,
  insertOpen,
  onOpenInsert,
  onInsert,
  onChange,
  onEditorFocus,
  onEditorDestroy,
  activeGutterIndex,
  onRowPointerEnter,
  onRowRef,
  onRegisterFloatingGutter,
}: {
  block: SogurBlock
  index: number
  insertOpen: boolean
  onOpenInsert: () => void
  onInsert: (type: SogurBlockType) => void
  onChange: (block: SogurBlock) => void
  onEditorFocus: (editor: Editor | null, type: SogurBlockType | null) => void
  onEditorDestroy: (editor: Editor) => void
  activeGutterIndex: number
  onRowPointerEnter: (index: number) => void
  onRowRef: (index: number, el: HTMLDivElement | null) => void
  onRegisterFloatingGutter: (
    registration: {
      insert: () => void
      dragAttributes: ReturnType<typeof useSortable>['attributes']
      dragListeners: ReturnType<typeof useSortable>['listeners']
    } | null,
  ) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: block.id,
  })
  const gutterActive = index === activeGutterIndex
  const attributesRef = useRef(attributes)
  const listenersRef = useRef(listeners)
  attributesRef.current = attributes
  listenersRef.current = listeners

  useEffect(() => {
    if (!gutterActive) return
    onRegisterFloatingGutter({
      insert: onOpenInsert,
      dragAttributes: attributesRef.current,
      dragListeners: listenersRef.current,
    })
    return () => onRegisterFloatingGutter(null)
  }, [gutterActive, onOpenInsert, onRegisterFloatingGutter])

  return (
    <div
      ref={(el) => {
        setNodeRef(el)
        onRowRef(index, el)
      }}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('group relative', isDragging && 'z-20 opacity-70')}
      onPointerEnter={() => onRowPointerEnter(index)}
    >
      {/* Spacer reserves Lattic-style gutter width while the floating controls slide. */}
      <div className="flex gap-1.5">
        <div className="w-11 shrink-0" aria-hidden />
        <div className="min-w-0 flex-1 rounded-md px-2 py-1 hover:bg-muted/10">
          {block.type === 'divider' ? (
            <hr className="my-5 border-border" />
          ) : block.type === 'image' ? (
            <ImageBlockEditor
              block={block}
              onChange={onChange}
              onFocus={() => onEditorFocus(null, null)}
            />
          ) : (
            <TextBlockEditor
              block={block}
              onChange={(content) => onChange({ ...block, content })}
              onFocus={(editor) => onEditorFocus(editor, block.type)}
              onDestroy={onEditorDestroy}
              onSlashInsert={onOpenInsert}
            />
          )}
        </div>
      </div>

      {insertOpen && (
        <div className="relative ml-[3.125rem]">
          <SogurBlockInsertMenu onSelect={onInsert} onClose={onOpenInsert} />
        </div>
      )}
    </div>
  )
}

export function SogurBlockEditor({
  value,
  onChange,
  onImageUpload,
  className,
}: SogurBlockEditorProps) {
  const [blocks, setBlocks] = useState<SogurBlock[]>(() => parseSogurBlocks(value).blocks)
  const [insertAfterId, setInsertAfterId] = useState<string | null>(null)
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)
  const [activeBlockType, setActiveBlockType] = useState<SogurBlockType | null>(null)
  const [hoveredBlockIndex, setHoveredBlockIndex] = useState<number | null>(null)
  const [focusedBlockIndex, setFocusedBlockIndex] = useState<number | null>(null)
  const [gutterTop, setGutterTop] = useState(0)
  const [floatingGutter, setFloatingGutter] = useState<{
    insert: () => void
    dragAttributes: ReturnType<typeof useSortable>['attributes']
    dragListeners: ReturnType<typeof useSortable>['listeners']
  } | null>(null)
  const lastEmittedRef = useRef<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const rowRefs = useRef<Map<number, HTMLDivElement>>(new Map())

  const activeGutterIndex = hoveredBlockIndex ?? focusedBlockIndex ?? 0

  useEffect(() => {
    if (value === lastEmittedRef.current) return
    setBlocks(parseSogurBlocks(value).blocks)
    setActiveEditor(null)
    setActiveBlockType(null)
  }, [value])

  const commitBlocks = useCallback(
    (next: SogurBlock[]) => {
      setBlocks(next)
      const serialized = serializeSogurBlocks(next)
      lastEmittedRef.current = serialized
      onChange(serialized)
    },
    [onChange],
  )

  const insertAfter = (afterId: string | null, type: SogurBlockType) => {
    const block = createSogurBlock(type)
    const index = afterId ? blocks.findIndex((candidate) => candidate.id === afterId) + 1 : blocks.length
    const next = [...blocks]
    next.splice(index < 0 ? next.length : index, 0, block)
    commitBlocks(next)
    setInsertAfterId(null)
  }

  const measureGutterTop = useCallback(() => {
    const row = rowRefs.current.get(activeGutterIndex)
    if (!row) return
    const next = row.offsetTop + Math.min(20, row.offsetHeight / 2)
    setGutterTop((prev) => (Math.abs(prev - next) < 0.5 ? prev : next))
  }, [activeGutterIndex])

  useEffect(() => {
    measureGutterTop()
  }, [measureGutterTop, blocks.length, activeGutterIndex])

  useEffect(() => {
    const list = listRef.current
    if (!list) return
    const ro = new ResizeObserver(() => measureGutterTop())
    ro.observe(list)
    for (const row of rowRefs.current.values()) ro.observe(row)
    return () => ro.disconnect()
  }, [measureGutterTop, blocks.length])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const from = blocks.findIndex((block) => block.id === active.id)
    const to = blocks.findIndex((block) => block.id === over.id)
    if (from >= 0 && to >= 0) commitBlocks(arrayMove(blocks, from, to))
  }

  const registerFloatingGutter = useCallback(
    (
      registration: {
        insert: () => void
        dragAttributes: ReturnType<typeof useSortable>['attributes']
        dragListeners: ReturnType<typeof useSortable>['listeners']
      } | null,
    ) => {
      setFloatingGutter(registration)
    },
    [],
  )

  return (
    <div className={cn('flex h-full min-h-0 flex-col overflow-hidden bg-transparent', className)}>
      <SogurBlockToolbar
        editor={activeEditor}
        blockType={activeBlockType}
        onImageUpload={onImageUpload}
      />
      <div
        className="min-h-0 flex-1 overflow-y-auto bg-transparent"
        onFocusCapture={(event) => {
          if (event.target instanceof HTMLInputElement) {
            setActiveEditor(null)
            setActiveBlockType(null)
          }
        }}
      >
        <main className="mx-auto min-h-full w-full max-w-4xl bg-transparent px-8 py-20 sm:px-16 sm:py-24">
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={blocks.map((block) => block.id)} strategy={verticalListSortingStrategy}>
              <div ref={listRef} className="relative space-y-3">
                <div
                  className="pointer-events-none absolute left-0 z-10 flex w-11 -translate-y-1/2 flex-row items-center justify-end gap-0.5 transition-[top] duration-200 ease-out"
                  style={{ top: gutterTop }}
                >
                  <div className="pointer-events-auto flex flex-row items-center justify-end gap-0.5">
                    <button
                      type="button"
                      data-sogur-insert-trigger
                      aria-label="Insert block below"
                      onPointerDown={(event) => event.stopPropagation()}
                      onClick={(event) => {
                        event.stopPropagation()
                        floatingGutter?.insert()
                      }}
                      className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      <Plus className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Drag to reorder block"
                      className="flex h-8 w-8 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                      {...(floatingGutter?.dragAttributes ?? {})}
                      {...(floatingGutter?.dragListeners ?? {})}
                      onClick={(event) => event.stopPropagation()}
                    >
                      <GripVertical className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {blocks.map((block, index) => (
                  <SortableSogurBlock
                    key={block.id}
                    block={block}
                    index={index}
                    insertOpen={insertAfterId === block.id}
                    onOpenInsert={() =>
                      setInsertAfterId((current) => (current === block.id ? null : block.id))
                    }
                    onInsert={(type) => insertAfter(block.id, type)}
                    onChange={(nextBlock) =>
                      commitBlocks(
                        blocks.map((candidate) =>
                          candidate.id === nextBlock.id ? nextBlock : candidate,
                        ),
                      )
                    }
                    onEditorFocus={(editor, type) => {
                      setActiveEditor(editor)
                      setActiveBlockType(type)
                      setFocusedBlockIndex(index)
                    }}
                    onEditorDestroy={(editor) => {
                      setActiveEditor((current) => (current === editor ? null : current))
                    }}
                    activeGutterIndex={activeGutterIndex}
                    onRowPointerEnter={setHoveredBlockIndex}
                    onRowRef={(rowIndex, el) => {
                      if (el) rowRefs.current.set(rowIndex, el)
                      else rowRefs.current.delete(rowIndex)
                    }}
                    onRegisterFloatingGutter={registerFloatingGutter}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>

          <div className="relative ml-11 mt-8">
            <button
              type="button"
              data-sogur-insert-trigger
              onPointerDown={(event) => event.stopPropagation()}
              onClick={() => setInsertAfterId((current) => (current === '__tail__' ? null : '__tail__'))}
              className="flex items-center gap-2 py-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <Plus className="h-4 w-4" />
              Add a block
            </button>
            {insertAfterId === '__tail__' && (
              <SogurBlockInsertMenu
                onSelect={(type) => insertAfter(null, type)}
                onClose={() => setInsertAfterId(null)}
              />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

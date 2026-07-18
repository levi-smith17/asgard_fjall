'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'
import TextAlign from '@tiptap/extension-text-align'
import { NodeRange } from '@tiptap/extension-node-range'
import DragHandle from '@tiptap/extension-drag-handle-react'
import { EditorContent, type Editor, useEditor } from '@tiptap/react'
import { BubbleMenu } from '@tiptap/react/menus'
import StarterKit from '@tiptap/starter-kit'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Code2,
  GripVertical,
  Heading1,
  Heading2,
  Heading3,
  ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  Strikethrough,
  Underline as UnderlineIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { parseSogurBlocks, sogurBlocksToHtml } from '@/lib/sogur-blocks'
import { SogurBlockInsertMenu, type SogurSlashCommand } from './sogur-block-insert-menu'

export type SogurBlockEditorProps = {
  value: string
  onChange: (serialized: string) => void
  onImageUpload?: (file: File) => Promise<string>
  className?: string
}

/** Convert persisted block JSON or legacy HTML into TipTap HTML. */
export function sogurValueToEditorHtml(value: string | null | undefined): string {
  const source = value ?? ''
  const trimmed = source.trim()
  if (!trimmed) return '<p></p>'
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    const html = sogurBlocksToHtml(parseSogurBlocks(source)).trim()
    return html || '<p></p>'
  }
  return source
}

function ToolbarButton({
  label,
  active = false,
  disabled = false,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={active || undefined}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-35',
        active && 'bg-muted text-foreground',
      )}
    >
      {children}
    </button>
  )
}

function FormattingBubble({ editor }: { editor: Editor }) {
  const setLink = () => {
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL', previous ?? 'https://')
    if (href === null) return
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  return (
    <BubbleMenu
      editor={editor}
      options={{ placement: 'top', offset: 8 }}
      shouldShow={({ editor: active, state }) => {
        const { empty } = state.selection
        return active.isEditable && !empty && !active.isActive('codeBlock')
      }}
      className="flex items-center gap-0.5 rounded-lg border border-border bg-card/95 p-1 shadow-lg backdrop-blur"
    >
      <ToolbarButton
        label="Bold"
        active={editor.isActive('bold')}
        onClick={() => editor.chain().focus().toggleBold().run()}
      >
        <Bold className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Italic"
        active={editor.isActive('italic')}
        onClick={() => editor.chain().focus().toggleItalic().run()}
      >
        <Italic className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Underline"
        active={editor.isActive('underline')}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
      >
        <UnderlineIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive('strike')}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        label="Heading 1"
        active={editor.isActive('heading', { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive('heading', { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 3"
        active={editor.isActive('heading', { level: 3 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      >
        <Heading3 className="h-4 w-4" />
      </ToolbarButton>
      <span className="mx-0.5 h-5 w-px bg-border" aria-hidden />
      <ToolbarButton
        label="Bulleted list"
        active={editor.isActive('bulletList')}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive('orderedList')}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Link"
        active={editor.isActive('link')}
        onClick={setLink}
      >
        <LinkIcon className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align left"
        active={editor.isActive({ textAlign: 'left' })}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
      >
        <AlignLeft className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align center"
        active={editor.isActive({ textAlign: 'center' })}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
      >
        <AlignCenter className="h-4 w-4" />
      </ToolbarButton>
      <ToolbarButton
        label="Align right"
        active={editor.isActive({ textAlign: 'right' })}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
      >
        <AlignRight className="h-4 w-4" />
      </ToolbarButton>
    </BubbleMenu>
  )
}

export function SogurBlockEditor({
  value,
  onChange,
  onImageUpload,
  className,
}: SogurBlockEditorProps) {
  const [slashOpen, setSlashOpen] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')
  const [slashPos, setSlashPos] = useState<{ top: number; left: number } | null>(null)
  const lastEmittedRef = useRef<string | null>(null)
  const editorShellRef = useRef<HTMLDivElement>(null)

  const openSlashMenu = useCallback((editorInstance: Editor, query = '') => {
    const coords = editorInstance.view.coordsAtPos(editorInstance.state.selection.from)
    const shell = editorShellRef.current?.getBoundingClientRect()
    if (shell) {
      setSlashPos({
        top: coords.bottom - shell.top + 8,
        left: Math.max(0, coords.left - shell.left),
      })
    } else {
      setSlashPos({ top: 96, left: 48 })
    }
    setSlashQuery(query)
    setSlashOpen(true)
  }, [])

  const openSlashMenuRef = useRef(openSlashMenu)
  openSlashMenuRef.current = openSlashMenu
  const slashOpenRef = useRef(slashOpen)
  slashOpenRef.current = slashOpen
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange

  const insertImage = useCallback(
    async (editor: Editor) => {
      if (onImageUpload) {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = async () => {
          const file = input.files?.[0]
          if (!file) return
          const src = await onImageUpload(file)
          if (src) editor.chain().focus().setImage({ src, alt: file.name }).run()
        }
        input.click()
        return
      }
      const src = window.prompt('Image URL', 'https://')
      if (src?.trim()) editor.chain().focus().setImage({ src: src.trim() }).run()
    },
    [onImageUpload],
  )

  const slashCommands: SogurSlashCommand[] = useMemo(
    () => [
      {
        id: 'text',
        label: 'Text',
        description: 'Plain paragraph',
        icon: Pilcrow,
        keywords: ['paragraph', 'body'],
        run: (editor) => editor.chain().focus().setParagraph().run(),
      },
      {
        id: 'h1',
        label: 'Heading 1',
        description: 'Large section heading',
        icon: Heading1,
        keywords: ['h1', 'title'],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      },
      {
        id: 'h2',
        label: 'Heading 2',
        description: 'Medium section heading',
        icon: Heading2,
        keywords: ['h2', 'subtitle'],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      },
      {
        id: 'h3',
        label: 'Heading 3',
        description: 'Small section heading',
        icon: Heading3,
        keywords: ['h3'],
        run: (editor) => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      },
      {
        id: 'bullet',
        label: 'Bulleted list',
        description: 'Create a simple list',
        icon: List,
        keywords: ['ul', 'unordered'],
        run: (editor) => editor.chain().focus().toggleBulletList().run(),
      },
      {
        id: 'ordered',
        label: 'Numbered list',
        description: 'Create a numbered list',
        icon: ListOrdered,
        keywords: ['ol', 'ordered'],
        run: (editor) => editor.chain().focus().toggleOrderedList().run(),
      },
      {
        id: 'quote',
        label: 'Quote',
        description: 'Capture a quotation',
        icon: Quote,
        keywords: ['blockquote'],
        run: (editor) => editor.chain().focus().toggleBlockquote().run(),
      },
      {
        id: 'code',
        label: 'Code',
        description: 'Code block',
        icon: Code2,
        keywords: ['codeblock', 'pre'],
        run: (editor) => editor.chain().focus().toggleCodeBlock().run(),
      },
      {
        id: 'divider',
        label: 'Divider',
        description: 'Visual separator',
        icon: Minus,
        keywords: ['hr', 'separator', 'line'],
        run: (editor) => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        id: 'image',
        label: 'Image',
        description: 'Upload or embed an image',
        icon: ImageIcon,
        keywords: ['img', 'media', 'photo'],
        run: (editor) => {
          void insertImage(editor)
        },
      },
    ],
    [insertImage],
  )

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        // StarterKit v3 already includes Underline — do not add it again.
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-primary underline underline-offset-2' },
      }),
      Image.configure({ inline: false, allowBase64: false }),
      Placeholder.configure({
        placeholder: ({ node }) => {
          if (node.type.name === 'heading') return 'Heading'
          return "Type '/' for commands…"
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      NodeRange,
    ],
    [],
  )

  const editor = useEditor({
    immediatelyRender: false,
    extensions,
    content: sogurValueToEditorHtml(value),
    editorProps: {
      attributes: {
        class: cn(
          'tiptap sogur-notion-editor min-h-[60vh] w-full max-w-none outline-none',
          'prose prose-neutral dark:prose-invert',
          'prose-headings:font-semibold prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl',
          'prose-p:my-2 prose-li:my-0.5 prose-img:rounded-lg',
          'prose-blockquote:border-l-2 prose-blockquote:border-border prose-blockquote:pl-4',
        ),
      },
      handleKeyDown: (_view, event) => {
        if (event.key === 'Escape' && slashOpenRef.current) {
          setSlashOpen(false)
          return true
        }
        return false
      },
    },
    onUpdate: ({ editor: active }) => {
      const html = active.getHTML()
      lastEmittedRef.current = html
      onChangeRef.current(html)

      const { $from } = active.state.selection
      const text = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
      const match = text.match(/(?:^|\s)\/([^/\n]*)$/)
      if (match) {
        openSlashMenuRef.current(active, match[1] ?? '')
      } else if (slashOpenRef.current) {
        setSlashOpen(false)
      }
    },
  })

  useEffect(() => {
    if (!editor) return
    if (value === lastEmittedRef.current) return
    const html = sogurValueToEditorHtml(value)
    lastEmittedRef.current = html
    editor.commands.setContent(html, { emitUpdate: false })
  }, [editor, value])

  const runSlashCommand = useCallback(
    (command: SogurSlashCommand) => {
      if (!editor) return
      const { $from } = editor.state.selection
      const text = $from.parent.textBetween(0, $from.parentOffset, undefined, '\ufffc')
      const match = text.match(/(?:^|\s)(\/[^/\n]*)$/)
      if (match) {
        const from = $from.pos - match[1]!.length
        editor.chain().focus().deleteRange({ from, to: $from.pos }).run()
      }
      command.run(editor)
      setSlashOpen(false)
      setSlashQuery('')
    },
    [editor],
  )

  return (
    <div className={cn('relative flex h-full min-h-0 flex-col overflow-hidden bg-transparent', className)}>
      <div className="min-h-0 flex-1 overflow-y-auto bg-transparent">
        <div
          ref={editorShellRef}
          className="relative mx-auto min-h-full w-full max-w-3xl bg-transparent px-12 py-16 sm:px-16 sm:py-20"
        >
          {editor ? (
            <>
              <DragHandle
                editor={editor}
                computePositionConfig={{ placement: 'left-start', strategy: 'absolute' }}
              >
                <div className="flex items-center gap-0.5 rounded-md bg-transparent">
                  <button
                    type="button"
                    aria-label="Insert block"
                    className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => {
                      editor.chain().focus().run()
                      openSlashMenu(editor, '')
                    }}
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className="flex h-7 w-7 cursor-grab items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground active:cursor-grabbing"
                    onMouseDown={(event) => event.preventDefault()}
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
              </DragHandle>

              <EditorContent editor={editor} />
              <FormattingBubble editor={editor} />

              {slashOpen && slashPos ? (
                <div
                  className="absolute z-50"
                  style={{ top: slashPos.top, left: slashPos.left }}
                >
                  <SogurBlockInsertMenu
                    query={slashQuery}
                    commands={slashCommands}
                    onSelect={runSlashCommand}
                    onClose={() => setSlashOpen(false)}
                  />
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import type { Editor } from '@tiptap/react'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  ImageIcon,
  Italic,
  Link,
  List,
  ListOrdered,
  Redo,
  Strikethrough,
  Underline,
  Undo,
  Upload,
} from 'lucide-react'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { cn } from '@/lib/utils'
import type { SogurBlockType } from '@/lib/sogur-blocks'

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
    <ToolbarTooltip label={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={active || undefined}
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
    </ToolbarTooltip>
  )
}

function Divider() {
  return <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden />
}

export function SogurBlockToolbar({
  editor,
  blockType,
  onImageUpload,
}: {
  editor: Editor | null
  blockType: SogurBlockType | null
  onImageUpload?: (file: File) => Promise<string>
}) {
  const [, forceRender] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)
  const disabled = !editor

  useEffect(() => {
    if (!editor) return
    const update = () => forceRender((value) => value + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  const run = (command: (activeEditor: Editor) => void) => {
    if (editor) command(editor)
  }

  const setLink = () => {
    if (!editor) return
    const previous = editor.getAttributes('link').href as string | undefined
    const href = window.prompt('Link URL', previous ?? 'https://')
    if (href === null) return
    if (!href.trim()) editor.chain().focus().extendMarkRange('link').unsetLink().run()
    else editor.chain().focus().extendMarkRange('link').setLink({ href: href.trim() }).run()
  }

  const insertImageUrl = () => {
    if (!editor) return
    const src = window.prompt('Image URL', 'https://')
    if (src?.trim()) editor.chain().focus().setImage({ src: src.trim() }).run()
  }

  const uploadImage = async (file: File) => {
    if (!editor || !onImageUpload) return
    setUploading(true)
    try {
      const src = await onImageUpload(file)
      if (src) editor.chain().focus().setImage({ src, alt: file.name }).run()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div
      role="toolbar"
      aria-label="Sogur formatting"
      className="sticky top-0 z-40 flex h-14 min-h-14 max-h-14 shrink-0 items-center overflow-x-auto border-b border-border bg-background/95 px-4 backdrop-blur"
      onMouseDown={(event) => event.preventDefault()}
    >
      <div className="mx-auto flex items-center gap-0.5">
        <ToolbarButton
          label="Undo"
          disabled={disabled || !editor?.can().undo()}
          onClick={() => run((active) => active.chain().focus().undo().run())}
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Redo"
          disabled={disabled || !editor?.can().redo()}
          onClick={() => run((active) => active.chain().focus().redo().run())}
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bold"
          disabled={disabled}
          active={editor?.isActive('bold')}
          onClick={() => run((active) => active.chain().focus().toggleBold().run())}
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          disabled={disabled}
          active={editor?.isActive('italic')}
          onClick={() => run((active) => active.chain().focus().toggleItalic().run())}
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          disabled={disabled}
          active={editor?.isActive('underline')}
          onClick={() => run((active) => active.chain().focus().toggleUnderline().run())}
        >
          <Underline className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          disabled={disabled}
          active={editor?.isActive('strike')}
          onClick={() => run((active) => active.chain().focus().toggleStrike().run())}
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Bulleted list"
          disabled={disabled}
          active={editor?.isActive('bulletList')}
          onClick={() => run((active) => active.chain().focus().toggleBulletList().run())}
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          disabled={disabled}
          active={editor?.isActive('orderedList')}
          onClick={() => run((active) => active.chain().focus().toggleOrderedList().run())}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Align left"
          disabled={disabled}
          active={editor?.isActive({ textAlign: 'left' })}
          onClick={() => run((active) => active.chain().focus().setTextAlign('left').run())}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align center"
          disabled={disabled}
          active={editor?.isActive({ textAlign: 'center' })}
          onClick={() => run((active) => active.chain().focus().setTextAlign('center').run())}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Align right"
          disabled={disabled}
          active={editor?.isActive({ textAlign: 'right' })}
          onClick={() => run((active) => active.chain().focus().setTextAlign('right').run())}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarButton>
        <Divider />
        <ToolbarButton
          label="Link"
          disabled={disabled}
          active={editor?.isActive('link')}
          onClick={setLink}
        >
          <Link className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          label="Insert image URL"
          disabled={disabled || blockType !== 'rich-text'}
          onClick={insertImageUrl}
        >
          <ImageIcon className="h-4 w-4" />
        </ToolbarButton>
        {onImageUpload && (
          <>
            <ToolbarTooltip label={uploading ? 'Uploading image' : 'Upload image'}>
              <button
                type="button"
                aria-label="Upload image"
                disabled={disabled || uploading || blockType !== 'rich-text'}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-35"
              >
                <Upload className={cn('h-4 w-4', uploading && 'animate-pulse')} />
              </button>
            </ToolbarTooltip>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0]
                if (file) void uploadImage(file)
                event.target.value = ''
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

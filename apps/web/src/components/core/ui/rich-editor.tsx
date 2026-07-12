'use client'

import { useState, useEffect, useRef } from 'react'
import { useEditor, EditorContent, type Editor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TableKit } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Underline from '@tiptap/extension-underline'
import {
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, List, ListOrdered, Quote,
  Code, Code2, Minus, Heading1, Heading2, Heading3, Table2, TableRowsSplit, Columns2,
  Trash2, ImageIcon, Loader2, Sun, Moon, Monitor, Upload,
} from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { Input } from '@/components/core/ui/input'
import { cn } from '@/lib/utils'

type ColorScheme = 'auto' | 'light' | 'dark'
export type FontSize = 'sm' | 'base' | 'lg' | 'xl'

const fontSizeLabels: Record<FontSize, string> = { sm: 'S', base: 'M', lg: 'L', xl: 'XL' }
const fontSizeOrder: FontSize[] = ['sm', 'base', 'lg', 'xl']

interface RichEditorProps {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  fullHeight?: boolean
  showToolbar?: boolean
  showColorToggle?: boolean
  showFontSizeToggle?: boolean
  onImageUpload?: (file: File) => Promise<string>
  fontSize?: FontSize
  onFontSizeChange?: (size: FontSize) => void
  editorClassName?: string
  contentClassName?: string
  minHeightClassName?: string
  onEditorFocus?: (editor: Editor) => void
}

export function useRichEditorToolbarState(editor: Editor | null) {
  const [, setTick] = useState(0)
  useEffect(() => {
    if (!editor) return
    const update = () => setTick((tick) => tick + 1)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => { editor.off('selectionUpdate', update); editor.off('transaction', update) }
  }, [editor])
  return editor
}

const fontSizeProseClass: Record<FontSize, string> = { sm: 'prose-sm', base: '', lg: 'prose-lg', xl: 'prose-xl' }

function buildEditorClass(scheme: ColorScheme, fontSize: FontSize = 'sm') {
  const sizeClass = fontSizeProseClass[fontSize]
  const base = ['w-full px-6 py-4 outline-none prose max-w-none', 'prose-headings:font-semibold prose-headings:text-foreground', 'prose-p:leading-relaxed prose-p:text-foreground/90 prose-li:text-foreground/90', 'prose-strong:text-foreground prose-blockquote:text-foreground/80', sizeClass].filter(Boolean).join(' ')
  if (scheme === 'dark') return `${base} prose-invert`
  if (scheme === 'light') return `${base} prose-neutral`
  return `${base} dark:prose-invert`
}

function ImagePopover({ onInsert, onUpload, disabled }: { onInsert: (src: string, alt: string) => void; onUpload?: (file: File) => Promise<string>; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const [src, setSrc] = useState('')
  const [alt, setAlt] = useState('')
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleInsert() {
    if (!src.trim()) return
    onInsert(src.trim(), alt.trim())
    setSrc(''); setAlt(''); setOpen(false)
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file || !onUpload) return
    setUploading(true)
    try {
      const url = await onUpload(file)
      onInsert(url, file.name.replace(/\.[^.]+$/, ''))
      setOpen(false)
    } finally { setUploading(false); e.target.value = '' }
  }

  return (
    <Popover open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" disabled={disabled} className="h-7 w-7" title="Insert image">
          <ImageIcon className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3" align="start" sideOffset={6}>
        <p className="mb-2 text-xs font-medium">Insert image</p>
        <div className="flex flex-col gap-2">
          <Input placeholder="Image URL" value={src} onChange={(e) => setSrc(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }} autoFocus />
          <Input placeholder="Alt text (optional)" value={alt} onChange={(e) => setAlt(e.target.value)} className="h-8 text-sm" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleInsert() } }} />
          <Button type="button" size="sm" className="h-7 text-xs" onClick={handleInsert} disabled={!src.trim()}>Insert</Button>
          {onUpload ? (
            <>
              <div className="flex items-center gap-2"><div className="h-px flex-1 bg-border" /><span className="text-[10px] text-muted-foreground">or</span><div className="h-px flex-1 bg-border" /></div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
              <Button type="button" variant="outline" size="sm" className="h-7 gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                {uploading ? 'Uploading…' : 'Upload from device'}
              </Button>
            </>
          ) : null}
        </div>
      </PopoverContent>
    </Popover>
  )
}

function TablePopover({ editor, disabled }: { editor: Editor | null; disabled?: boolean }) {
  const [open, setOpen] = useState(false)
  const inTable = editor?.isActive('table')

  return (
    <Popover open={open && !disabled} onOpenChange={(next) => !disabled && setOpen(next)}>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', inTable && 'bg-muted')} title="Table">
          <Table2 className="h-3.5 w-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-44 p-1" align="start" sideOffset={6}>
        {!inTable ? (
          <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run(); setOpen(false) }}>
            <Table2 className="h-3.5 w-3.5 shrink-0" />Insert 3×3 table
          </button>
        ) : (
          <div className="flex flex-col gap-0.5">
            <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().addRowAfter().run(); setOpen(false) }}><TableRowsSplit className="h-3.5 w-3.5 shrink-0" />Add row below</button>
            <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().deleteRow().run(); setOpen(false) }}><TableRowsSplit className="h-3.5 w-3.5 shrink-0 rotate-180" />Delete row</button>
            <div className="my-0.5 h-px bg-border" />
            <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().addColumnAfter().run(); setOpen(false) }}><Columns2 className="h-3.5 w-3.5 shrink-0" />Add column right</button>
            <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().deleteColumn().run(); setOpen(false) }}><Columns2 className="h-3.5 w-3.5 shrink-0 opacity-50" />Delete column</button>
            <div className="my-0.5 h-px bg-border" />
            <button type="button" className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-xs text-destructive transition-colors hover:bg-muted/60" onClick={() => { editor?.chain().focus().deleteTable().run(); setOpen(false) }}><Trash2 className="h-3.5 w-3.5 shrink-0" />Delete table</button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}

const schemeOrder: ColorScheme[] = ['auto', 'light', 'dark']
const schemeIcons: Record<ColorScheme, React.ReactNode> = {
  auto: <Monitor className="h-3.5 w-3.5" />,
  light: <Sun className="h-3.5 w-3.5" />,
  dark: <Moon className="h-3.5 w-3.5" />,
}
const schemeTitles: Record<ColorScheme, string> = {
  auto: 'Color: Auto (follows theme)',
  light: 'Color: Light (white bg)',
  dark: 'Color: Dark (black bg)',
}
const schemeWrapperStyle: Record<ColorScheme, React.CSSProperties> = {
  auto: {},
  light: { backgroundColor: '#ffffff' },
  dark: { backgroundColor: '#000000' },
}

export function RichEditorToolbar({
  editor,
  showColorToggle = false,
  showFontSizeToggle = false,
  onImageUpload,
  fontSize = 'sm',
  onFontSizeChange,
  colorScheme = 'auto',
  onColorSchemeChange,
}: {
  editor: Editor | null
  showColorToggle?: boolean
  showFontSizeToggle?: boolean
  onImageUpload?: (file: File) => Promise<string>
  fontSize?: FontSize
  onFontSizeChange?: (size: FontSize) => void
  colorScheme?: ColorScheme
  onColorSchemeChange?: (scheme: ColorScheme) => void
}) {
  useRichEditorToolbarState(editor)
  const disabled = !editor
  const sep = <div className="mx-0.5 h-4 w-px shrink-0 bg-border" />
  const chain = () => editor?.chain().focus()
  const cycleScheme = () => {
    if (!editor || !onColorSchemeChange) return
    const idx = schemeOrder.indexOf(colorScheme)
    onColorSchemeChange(schemeOrder[(idx + 1) % schemeOrder.length])
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-0.5', disabled && 'opacity-60')}>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('heading', { level: 1 }) && 'bg-muted')} onClick={() => chain()?.toggleHeading({ level: 1 }).run()}><Heading1 className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('heading', { level: 2 }) && 'bg-muted')} onClick={() => chain()?.toggleHeading({ level: 2 }).run()}><Heading2 className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('heading', { level: 3 }) && 'bg-muted')} onClick={() => chain()?.toggleHeading({ level: 3 }).run()}><Heading3 className="h-3.5 w-3.5" /></Button>
      {sep}
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('bold') && 'bg-muted')} onClick={() => chain()?.toggleBold().run()}><Bold className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('italic') && 'bg-muted')} onClick={() => chain()?.toggleItalic().run()}><Italic className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('strike') && 'bg-muted')} onClick={() => chain()?.toggleStrike().run()}><Strikethrough className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('underline') && 'bg-muted')} onClick={() => chain()?.toggleUnderline().run()}><UnderlineIcon className="h-3.5 w-3.5" /></Button>
      {sep}
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('blockquote') && 'bg-muted')} onClick={() => chain()?.toggleBlockquote().run()}><Quote className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('code') && 'bg-muted')} onClick={() => chain()?.toggleCode().run()}><Code className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('codeBlock') && 'bg-muted')} onClick={() => chain()?.toggleCodeBlock().run()}><Code2 className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className="h-7 w-7" onClick={() => chain()?.setHorizontalRule().run()}><Minus className="h-3.5 w-3.5" /></Button>
      {sep}
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('bulletList') && 'bg-muted')} onClick={() => chain()?.toggleBulletList().run()}><List className="h-3.5 w-3.5" /></Button>
      <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn('h-7 w-7', editor?.isActive('orderedList') && 'bg-muted')} onClick={() => chain()?.toggleOrderedList().run()}><ListOrdered className="h-3.5 w-3.5" /></Button>
      {sep}
      <TablePopover editor={editor} disabled={disabled} />
      <ImagePopover disabled={disabled} onInsert={(src, alt) => chain()?.setImage({ src, alt }).run()} onUpload={onImageUpload} />
      {showColorToggle ? (
        <>{sep}<Button type="button" variant="ghost" size="icon" className={cn('h-7 w-7', colorScheme !== 'auto' && 'bg-muted')} onClick={cycleScheme} title={schemeTitles[colorScheme]}>{schemeIcons[colorScheme]}</Button></>
      ) : null}
      {showFontSizeToggle ? (
        <>{sep}<div className="flex items-center gap-0.5">{fontSizeOrder.map((size) => (<button key={size} type="button" title={`Font size: ${size}`} onClick={() => onFontSizeChange?.(size)} className={cn('h-7 rounded px-1.5 text-xs font-medium transition-colors hover:bg-muted', fontSize === size ? 'bg-muted text-foreground' : 'text-muted-foreground')}>{fontSizeLabels[size]}</button>))}</div></>
      ) : null}
    </div>
  )
}

export function RichEditor({
  value,
  onChange,
  fullHeight = false,
  showToolbar = true,
  showColorToggle = false,
  showFontSizeToggle = false,
  onImageUpload,
  fontSize: fontSizeProp,
  onFontSizeChange,
  editorClassName,
  contentClassName,
  minHeightClassName,
  onEditorFocus,
}: RichEditorProps) {
  const [colorScheme, setColorScheme] = useState<ColorScheme>('auto')
  const [internalFontSize, setInternalFontSize] = useState<FontSize>('sm')
  const fontSize = fontSizeProp ?? internalFontSize
  const wrapperRef = useRef<HTMLDivElement>(null)

  function handleFontSizeChange(size: FontSize) {
    if (onFontSizeChange) onFontSizeChange(size)
    else setInternalFontSize(size)
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [StarterKit, TableKit, Image.configure({ inline: false, allowBase64: false }), Underline],
    content: value,
    editorProps: {
      attributes: { class: editorClassName ?? buildEditorClass('auto', fontSizeProp ?? internalFontSize) },
    },
    onUpdate: ({ editor: ed }) => { onChange(ed.getHTML()) },
  })

  useEffect(() => {
    if (!editor || !onEditorFocus) return
    const handleFocus = () => onEditorFocus(editor)
    editor.on('focus', handleFocus)
    return () => { editor.off('focus', handleFocus) }
  }, [editor, onEditorFocus])

  useEffect(() => {
    if (!editor) return
    editor.setOptions({ editorProps: { attributes: { class: editorClassName ?? buildEditorClass(colorScheme, fontSize) } } })
  }, [editor, colorScheme, fontSize, editorClassName])

  useEffect(() => {
    if (!editor) return
    const current = editor.getHTML()
    if (current !== value) editor.commands.setContent(value, { emitUpdate: false })
  }, [editor, value])

  function handleWrapperClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editor || !wrapperRef.current) return
    if (e.target === wrapperRef.current) editor.commands.focus('end')
  }

  if (!editor) return null

  return (
    <div className={cn('flex flex-col overflow-hidden', fullHeight ? 'h-full' : '')}>
      {showToolbar ? (
        <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-center overflow-hidden border-b bg-muted/20 px-3">
          <RichEditorToolbar editor={editor} showColorToggle={showColorToggle} showFontSizeToggle={showFontSizeToggle} onImageUpload={onImageUpload} fontSize={fontSize} onFontSizeChange={handleFontSizeChange} colorScheme={colorScheme} onColorSchemeChange={setColorScheme} />
        </div>
      ) : null}
      <div ref={wrapperRef} onClick={handleWrapperClick} style={schemeWrapperStyle[colorScheme]}
        className={cn('overflow-y-auto transition-colors', fullHeight ? 'min-h-0 flex-1' : minHeightClassName ?? 'min-h-[200px]', contentClassName)}>
        <EditorContent editor={editor} className={cn(fullHeight && 'min-h-full')} />
      </div>
    </div>
  )
}

import { RichEditor } from '@/components/core/ui/rich-editor'
import { cn } from '@/lib/utils'
import { useOrdstirrRichText } from './ordstirr-rich-text-context'

const inlineEditorClass =
  'w-full border-0 px-0 py-1 shadow-none outline-none ring-0 prose prose-base max-w-none text-muted-foreground dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground focus:outline-none focus:ring-0'

export function OrdstirrInlineRichText({
  value,
  onChange,
  placeholder,
  className,
  minHeightClassName = 'min-h-[3rem]',
}: {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  className?: string
  minHeightClassName?: string
}) {
  const { setActiveEditor } = useOrdstirrRichText()

  return (
    <div
      className={cn(
        'text-left [&_.ProseMirror]:border-0 [&_.ProseMirror]:shadow-none [&_.ProseMirror]:outline-none [&_.ProseMirror:focus]:outline-none',
        className,
      )}
      data-ordstirr-editor
      onPointerDown={(event) => event.stopPropagation()}
      onMouseDown={(event) => event.stopPropagation()}
      onClick={(event) => event.stopPropagation()}
    >
      <RichEditor
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        showToolbar={false}
        editorClassName={inlineEditorClass}
        contentClassName="overflow-visible"
        minHeightClassName={minHeightClassName}
        onEditorFocus={setActiveEditor}
      />
    </div>
  )
}

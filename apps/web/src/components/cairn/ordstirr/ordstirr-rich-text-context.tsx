import { createContext, useContext, useMemo, useState } from 'react'
import type { Editor } from '@tiptap/react'
import { RichEditorToolbar } from '@/components/core/ui/rich-editor'

type OrdstirrRichTextContextValue = {
  setActiveEditor: (editor: Editor | null) => void
}

const OrdstirrRichTextContext = createContext<OrdstirrRichTextContextValue | null>(null)

export function OrdstirrRichTextProvider({ children }: { children: React.ReactNode }) {
  const [activeEditor, setActiveEditor] = useState<Editor | null>(null)

  const value = useMemo(
    () => ({
      setActiveEditor,
    }),
    [],
  )

  return (
    <OrdstirrRichTextContext.Provider value={value}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="relative flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-center overflow-hidden border-b border-border bg-muted/20 px-3">
          <RichEditorToolbar editor={activeEditor} />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">{children}</div>
      </div>
    </OrdstirrRichTextContext.Provider>
  )
}

export function useOrdstirrRichText() {
  const context = useContext(OrdstirrRichTextContext)
  if (!context) {
    throw new Error('useOrdstirrRichText must be used within OrdstirrRichTextProvider')
  }
  return context
}

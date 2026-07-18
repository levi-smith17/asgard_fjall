'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import {
  saveFjallLog,
  uploadFjallLogImage,
  type FjallLogView,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { SogurBlockEditor } from './editor'

let activeSave: (() => Promise<boolean>) | null = null

export async function saveActiveSogurThattr(): Promise<boolean> {
  if (!activeSave) return true
  return activeSave()
}

export function SogurThattrEditor({
  thattr,
  onSaved,
  onStateChange,
}: {
  thattr: FjallLogView
  onSaved: (log: FjallLogView) => void
  onStateChange?: (state: { dirty: boolean; saving: boolean }) => void
}) {
  const terms = useTerms()
  const [content, setContent] = useState(thattr.content)
  const [savedContent, setSavedContent] = useState(thattr.content)
  const [saving, setSaving] = useState(false)
  const contentRef = useRef(content)
  const savedContentRef = useRef(savedContent)
  const thattrRef = useRef(thattr)

  contentRef.current = content
  savedContentRef.current = savedContent
  thattrRef.current = thattr

  const dirty = content !== savedContent

  useEffect(() => {
    setContent(thattr.content)
    setSavedContent(thattr.content)
  }, [thattr.id, thattr.content])

  useEffect(() => {
    onStateChange?.({ dirty, saving })
  }, [dirty, saving, onStateChange])

  const save = useCallback(async () => {
    const current = thattrRef.current
    const nextContent = contentRef.current
    if (nextContent === savedContentRef.current) return true
    setSaving(true)
    try {
      const saved = await saveFjallLog({
        id: current.id,
        title: current.title,
        content: nextContent,
        sagaId: current.sagaId,
        greinId: current.greinId,
        laufId: current.laufId,
        runIds: current.runir.map((run) => run.runId),
      })
      setSavedContent(saved.content)
      savedContentRef.current = saved.content
      onSaved(saved)
      toast.success(`${terms.thattrSingular} saved`)
      return true
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to save ${terms.thattrSingular.toLowerCase()}`,
      )
      return false
    } finally {
      setSaving(false)
    }
  }, [onSaved, terms.thattrSingular])

  useEffect(() => {
    activeSave = save
    return () => {
      if (activeSave === save) activeSave = null
    }
  }, [save])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key === 's') {
        event.preventDefault()
        void save()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [save])

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden" data-sogur-editor>
      <SogurBlockEditor
        value={content}
        onChange={setContent}
        onImageUpload={async (file) => uploadFjallLogImage(file, thattr.id)}
        className="min-h-0 flex-1"
      />
    </div>
  )
}

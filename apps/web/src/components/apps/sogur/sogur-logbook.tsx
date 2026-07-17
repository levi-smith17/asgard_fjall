import { useCallback, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FilePlus,
  GripVertical,
  LayoutList,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react'
import { MarkerPicker } from '@/components/apps/marker-picker'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { RichEditor, type FontSize } from '@/components/core/ui/rich-editor'
import {
  deleteFjallLog,
  saveFjallLog,
  uploadFjallLogImage,
  type FjallLogView,
} from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'
import { toMarkerView } from '@/lib/data-format'
import type { FjallMarker } from '@/lib/data-types'
import { pagePreview } from '@/lib/sogur-format'
import { cn } from '@/lib/utils'
import { SogurLaufarPicker, type SogurWaypointOption } from './sogur-laufar-picker'

export function SogurLogbook({
  bookId,
  bookName,
  trailId,
  initialLogs,
  initialPageId,
  markers,
  waypoints,
  onLogsChange,
  onOpenPageOrder,
}: {
  bookId: string
  bookName: string
  trailId: string
  initialLogs: FjallLogView[]
  initialPageId?: string | null
  markers: FjallMarker[]
  waypoints: SogurWaypointOption[]
  onLogsChange: (logs: FjallLogView[]) => void
  onOpenPageOrder: () => void
}) {
  const terms = useTerms()
  const [searchParams, setSearchParams] = useSearchParams()
  const [localLogs, setLocalLogs] = useState(initialLogs)
  const markerViews = markers.map(toMarkerView)

  useEffect(() => {
    setLocalLogs(initialLogs)
  }, [bookId, initialLogs])

  const resolveInitialIndex = () => {
    if (initialPageId) {
      const idx = localLogs.findIndex((log) => log.id === initialPageId)
      if (idx >= 0) return idx
    }
    const fromUrl = searchParams.get('page')
    if (fromUrl) {
      const idx = localLogs.findIndex((log) => log.id === fromUrl)
      if (idx >= 0) return idx
    }
    return 0
  }

  const [currentIndex, setCurrentIndex] = useState(resolveInitialIndex)
  const currentLog = localLogs[currentIndex] ?? null

  const [content, setContent] = useState(currentLog?.content ?? '')
  const [savedContent, setSavedContent] = useState(currentLog?.content ?? '')
  const [title, setTitle] = useState(currentLog?.title ?? '')
  const [savedTitle, setSavedTitle] = useState(currentLog?.title ?? '')
  const [markerIds, setMarkerIds] = useState<string[]>(
    currentLog?.markers?.map((marker) => marker.markerId) ?? [],
  )
  const [savedMarkerIds, setSavedMarkerIds] = useState(markerIds)
  const [waypointId, setWaypointId] = useState<string | null>(currentLog?.waypointId ?? null)
  const [savedWaypointId, setSavedWaypointId] = useState(waypointId)

  const markersEqual =
    markerIds.length === savedMarkerIds.length &&
    markerIds.every((id) => savedMarkerIds.includes(id))
  const isDirty =
    content !== savedContent ||
    title !== savedTitle ||
    !markersEqual ||
    waypointId !== savedWaypointId

  const contentRef = useRef(content)
  const titleRef = useRef(title)
  const markerIdsRef = useRef(markerIds)
  const waypointIdRef = useRef(waypointId)
  const currentLogIdRef = useRef(currentLog?.id ?? null)
  contentRef.current = content
  titleRef.current = title
  markerIdsRef.current = markerIds
  waypointIdRef.current = waypointId
  currentLogIdRef.current = currentLog?.id ?? null

  const [saving, setSaving] = useState(false)
  const [addingPage, setAddingPage] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [pendingNavIndex, setPendingNavIndex] = useState<number | null>(null)
  const [pageListOpen, setPageListOpen] = useState(false)
  const [logbookFontSize, setLogbookFontSize] = useState<FontSize>('sm')

  const metaAutoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const saved = window.localStorage.getItem('sogur-font-size')
    if (['sm', 'base', 'lg', 'xl'].includes(saved ?? '')) {
      setLogbookFontSize(saved as FontSize)
    }
  }, [])

  function handleFontSizeChange(size: FontSize) {
    setLogbookFontSize(size)
    window.localStorage.setItem('sogur-font-size', size)
  }

  useEffect(() => {
    if (!currentLog) return
    setContent(currentLog.content)
    setSavedContent(currentLog.content)
    setTitle(currentLog.title ?? '')
    setSavedTitle(currentLog.title ?? '')
    const ids = currentLog.markers?.map((marker) => marker.markerId) ?? []
    setMarkerIds(ids)
    setSavedMarkerIds(ids)
    setWaypointId(currentLog.waypointId ?? null)
    setSavedWaypointId(currentLog.waypointId ?? null)
  }, [currentLog?.id])

  function updateUrl(pageId: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('book', bookId)
    params.set('page', pageId)
    setSearchParams(params, { replace: true })
  }

  const persistLog = useCallback(
    async (
      logId: string,
      html: string,
      pageTitle: string,
      ids: string[],
      pageWaypointId: string | null,
      message: string | false = 'Saved',
    ) => {
      const updated = await saveFjallLog({
        id: logId,
        title: pageTitle || null,
        content: html,
        trailId,
        markerIds: ids,
        waypointId: pageWaypointId,
      })
      setSavedContent(html)
      setSavedTitle(pageTitle)
      setSavedMarkerIds(ids)
      setSavedWaypointId(pageWaypointId)
      setLocalLogs((prev) => {
        const next = prev.map((log) => (log.id === logId ? updated : log))
        onLogsChange(next)
        return next
      })
      if (message) toast.success(message)
    },
    [trailId, onLogsChange],
  )

  function scheduleMetaSave(
    ids: string[],
    pageWaypointId: string | null,
    message: string,
  ) {
    if (metaAutoSaveTimer.current) clearTimeout(metaAutoSaveTimer.current)
    metaAutoSaveTimer.current = setTimeout(async () => {
      const logId = currentLogIdRef.current
      if (!logId) return
      await persistLog(
        logId,
        contentRef.current,
        titleRef.current,
        ids,
        pageWaypointId,
        message,
      )
    }, 400)
  }

  async function handleSave() {
    if (!currentLog) return
    setSaving(true)
    try {
      await persistLog(
        currentLog.id,
        contentRef.current,
        titleRef.current,
        markerIdsRef.current,
        waypointIdRef.current,
      )
    } finally {
      setSaving(false)
    }
  }

  const handleSaveRef = useRef(handleSave)
  handleSaveRef.current = handleSave

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault()
        handleSaveRef.current()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  function activateLog(log: FjallLogView, targetIndex: number) {
    setCurrentIndex(targetIndex)
    setContent(log.content)
    setSavedContent(log.content)
    setTitle(log.title ?? '')
    setSavedTitle(log.title ?? '')
    const ids = log.markers?.map((marker) => marker.markerId) ?? []
    setMarkerIds(ids)
    setSavedMarkerIds(ids)
    setWaypointId(log.waypointId ?? null)
    setSavedWaypointId(log.waypointId ?? null)
    updateUrl(log.id)
  }

  function doNavigate(targetIndex: number) {
    const target = localLogs[targetIndex]
    if (!target) return
    activateLog(target, targetIndex)
  }

  function goToPage(targetIndex: number) {
    if (targetIndex === currentIndex) return
    if (isDirty) {
      setPendingNavIndex(targetIndex)
      setShowUnsavedDialog(true)
      return
    }
    doNavigate(targetIndex)
  }

  async function handleAddPage() {
    if (isDirty && currentLog) {
      setSaving(true)
      try {
        await persistLog(
          currentLog.id,
          contentRef.current,
          titleRef.current,
          markerIdsRef.current,
          waypointIdRef.current,
          false,
        )
      } finally {
        setSaving(false)
      }
    }
    setAddingPage(true)
    try {
      const created = await saveFjallLog({
        title: null,
        content: '<p></p>',
        trailId,
        markerIds: [],
        waypointId: null,
      })
      setLocalLogs((prev) => {
        const next = [...prev, created]
        onLogsChange(next)
        return next
      })
      activateLog(created, localLogs.length)
    } catch {
      toast.error('Failed to add page')
    } finally {
      setAddingPage(false)
    }
  }

  async function handleDeletePage() {
    if (!currentLog || localLogs.length <= 1) return
    setDeleting(true)
    try {
      await deleteFjallLog(currentLog.id)
      const next = localLogs.filter((log) => log.id !== currentLog.id)
      const newIndex = Math.min(currentIndex, next.length - 1)
      setLocalLogs(next)
      onLogsChange(next)
      doNavigate(newIndex)
    } catch {
      toast.error('Failed to delete page')
    } finally {
      setDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  const handleImageUpload = useCallback(
    async (file: File) => {
      if (!currentLog) throw new Error('No active page')
      return uploadFjallLogImage(file, currentLog.id)
    },
    [currentLog],
  )

  if (!currentLog) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        This {terms.notesSingular.toLowerCase()} has no pages yet.
      </div>
    )
  }

  const canPrev = currentIndex > 0
  const canNext = currentIndex < localLogs.length - 1

  return (
    <div className="flex h-full min-h-0 w-full flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 overflow-x-auto border-b border-border px-4">
        <span className="shrink-0 text-sm font-medium">{bookName}</span>
        {isDirty ? (
          <span
            className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
            title="Unsaved changes"
          />
        ) : null}
        <div className="hidden h-4 w-px bg-border sm:block" />
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Page title (optional)"
          className="min-w-[8rem] flex-1 bg-transparent text-sm font-medium placeholder:text-muted-foreground/40 focus:outline-none"
        />

        <MarkerPicker
          markers={markerViews}
          selected={markerIds}
          onChange={(ids) => {
            setMarkerIds(ids)
            markerIdsRef.current = ids
            scheduleMetaSave(ids, waypointIdRef.current, `${terms.runir} saved`)
          }}
          placeholder={terms.runir}
          toolbar
          inline
        />
        <SogurLaufarPicker
          waypoints={waypoints}
          selectedId={waypointId}
          greinName={bookName}
          onChange={(id) => {
            setWaypointId(id)
            waypointIdRef.current = id
            scheduleMetaSave(markerIdsRef.current, id, `${terms.laufarSingular} saved`)
          }}
        />

        <div className="ml-auto flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onOpenPageOrder}
            title="Reorder pages"
          >
            <GripVertical className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canPrev}
            onClick={() => goToPage(currentIndex - 1)}
            title="Previous page"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <Popover open={pageListOpen} onOpenChange={setPageListOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 gap-1 px-2 text-xs">
                <LayoutList className="h-3.5 w-3.5" />
                {currentIndex + 1} / {localLogs.length}
                <ChevronDown className="h-3 w-3 opacity-60" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-0" align="center">
              <div className="border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground">
                Pages
              </div>
              <div className="max-h-72 overflow-y-auto">
                {localLogs.map((log, index) => (
                  <button
                    key={log.id}
                    type="button"
                    onClick={() => {
                      setPageListOpen(false)
                      goToPage(index)
                    }}
                    className={cn(
                      'flex w-full flex-col items-start gap-0.5 border-b border-border px-3 py-2 text-left text-xs last:border-b-0 hover:bg-muted/50',
                      index === currentIndex && 'bg-primary/10',
                    )}
                  >
                    <span className="font-medium">{pagePreview(log)}</span>
                    <span className="text-muted-foreground">
                      {new Date(log.createdAt).toLocaleDateString()}
                    </span>
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            disabled={!canNext}
            onClick={() => goToPage(currentIndex + 1)}
            title="Next page"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleSave}
            disabled={saving || !isDirty}
            title="Save (⌘S)"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={handleAddPage}
            disabled={addingPage}
            title="Add page"
          >
            {addingPage ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <FilePlus className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-destructive hover:text-destructive"
            onClick={() => setShowDeleteDialog(true)}
            disabled={deleting || localLogs.length <= 1}
            title="Delete page"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <RichEditor
          key={currentLog.id}
          value={content}
          onChange={setContent}
          fullHeight
          showFontSizeToggle
          fontSize={logbookFontSize}
          onFontSizeChange={handleFontSizeChange}
          onImageUpload={handleImageUpload}
        />
      </div>

      <ConfirmDialog
        open={showDeleteDialog}
        title="Delete page?"
        description={`This page will be permanently removed from the ${terms.notesSingular.toLowerCase()}.`}
        confirmLabel="Delete"
        confirmVariant="destructive"
        onCancel={() => setShowDeleteDialog(false)}
        onConfirm={handleDeletePage}
      />

      <ConfirmDialog
        open={showUnsavedDialog}
        title="Unsaved changes"
        description="Save your changes before switching pages?"
        confirmLabel="Save"
        cancelLabel="Discard"
        onCancel={() => {
          setShowUnsavedDialog(false)
          if (pendingNavIndex !== null) {
            doNavigate(pendingNavIndex)
            setPendingNavIndex(null)
          }
        }}
        onConfirm={async () => {
          setShowUnsavedDialog(false)
          await handleSave()
          if (pendingNavIndex !== null) {
            doNavigate(pendingNavIndex)
            setPendingNavIndex(null)
          }
        }}
      />
    </div>
  )
}

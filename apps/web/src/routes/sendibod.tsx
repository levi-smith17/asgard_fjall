import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { RailListSkeleton, TableSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import { SendibodContextBar } from '@/components/cairn/sendibod/sendibod-context-bar'
import { SendibodFilterBar } from '@/components/cairn/sendibod/sendibod-filter-bar'
import { SendibodSignalDetail } from '@/components/cairn/sendibod/sendibod-signal-detail'
import { SendibodSignalList } from '@/components/cairn/sendibod/sendibod-signal-list'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import {
  deleteCairnSignal,
  fetchCairnFullSettings,
  fetchCairnSignals,
  fetchCairnStatus,
} from '@/lib/cairn-api'

export function SendibodPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()

  const clearSelection = useCallback(() => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('id')
      return next
    })
  }, [setSearchParams])

  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  const signalsQuery = useQuery({
    queryKey: ['cairn-signals'],
    queryFn: fetchCairnSignals,
    enabled: configured,
  })

  const settingsQuery = useQuery({
    queryKey: ['cairn-settings-signals'],
    queryFn: fetchCairnFullSettings,
    enabled: configured,
    staleTime: 60_000,
  })

  const signals = signalsQuery.data ?? []
  const showSnippets = settingsQuery.data?.signals.showSnippets ?? true
  const autoMarkRead = settingsQuery.data?.signals.autoMarkRead ?? true
  const unreadCount = signals.filter((signal) => !signal.read).length

  const filtered = useMemo(() => {
    return signals.filter((signal) => {
      if (!search.trim()) return true
      const query = search.toLowerCase()
      return (
        signal.senderName.toLowerCase().includes(query) ||
        signal.senderEmail.toLowerCase().includes(query) ||
        signal.body.toLowerCase().includes(query)
      )
    })
  }, [signals, search])

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filtered],
  )

  const selectedId = searchParams.get('id')
  const selectedSignal =
    sorted.find((signal) => signal.id === selectedId) ??
    signals.find((signal) => signal.id === selectedId) ??
    null

  const inspectorOpen = inspectorPinned || selectedId != null
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  function selectSignal(id: string) {
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.set('id', id)
      return next
    })
  }

  const handleCanvasPointerDown = useCallback(
    (event: React.PointerEvent) => {
      if (inspectorPinned || selectedId == null) return
      const target = event.target as HTMLElement
      if (target.closest('[data-inspectable]')) return
      clearSelection()
    },
    [inspectorPinned, selectedId, clearSelection],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && selectedId) {
        clearSelection()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, selectedId, clearSelection])

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteCairnSignal(deleteTarget.id)
    await queryClient.invalidateQueries({ queryKey: ['cairn-signals'] })
    if (selectedId === deleteTarget.id) clearSelection()
    setDeleteTarget(null)
  }

  return (
    <>
      <StudioLayout
        contextBar={
          <SendibodContextBar
            messageCount={signalsQuery.data ? signals.length : undefined}
            unreadCount={signalsQuery.data ? unreadCount : undefined}
            inspectorPinned={inspectorPinned}
            onInspectorPinnedChange={setInspectorPinned}
          />
        }
        canvas={
          statusQuery.isLoading ? (
            <TableSkeleton columns={3} rows={10} />
          ) : !configured ? (
            <CairnNotConfiguredNotice />
          ) : (
            <div className="flex h-full flex-col" onPointerDown={handleCanvasPointerDown}>
              <SendibodFilterBar
                search={search}
                onSearchChange={setSearch}
                onRefresh={() => void signalsQuery.refetch()}
                isRefreshing={signalsQuery.isFetching}
              />
              {signalsQuery.isLoading ? (
                <RailListSkeleton rows={10} />
              ) : (
                <SendibodSignalList
                  signals={sorted}
                  selectedId={selectedId}
                  showSnippets={showSnippets}
                  onSelect={selectSignal}
                  onDelete={(id, name) => setDeleteTarget({ id, name })}
                />
              )}
            </div>
          )
        }
        inspectorState={configured && !statusQuery.isLoading ? inspectorState : 'hidden'}
        inspectorHint="Select a message"
        inspector={
          selectedSignal ? (
            <SendibodSignalDetail signal={selectedSignal} autoMarkRead={autoMarkRead} />
          ) : inspectorPinned ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inspector
                </p>
              </div>
              <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
                Select a message to read and reply.
              </p>
            </div>
          ) : null
        }
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        title="Delete message"
        description={
          deleteTarget
            ? `Delete the message from ${deleteTarget.name}? This cannot be undone.`
            : ''
        }
        confirmLabel="Delete"
        confirmVariant="destructive"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  )
}

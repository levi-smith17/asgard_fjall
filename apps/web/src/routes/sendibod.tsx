import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { RailListSkeleton, TableSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { InspectorEmptyState } from '@/components/core/ui/inspector-chrome'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { SendibodContextBar } from '@/components/apps/sendibod/sendibod-context-bar'
import { SendibodFilterBar } from '@/components/apps/sendibod/sendibod-filter-bar'
import { SendibodMessageDetail } from '@/components/apps/sendibod/sendibod-message-detail'
import { SendibodMessageList } from '@/components/apps/sendibod/sendibod-message-list'
import { SendibodSettingsForm } from '@/components/apps/sendibod/sendibod-settings-form'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import {
  deleteFjallSendibod,
  fetchFjallFullSettings,
  fetchFjallSendibod,
  fetchFjallStatus,
} from '@/lib/data-api'

export function SendibodPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null)
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [showSettings, setShowSettings] = useState(false)

  const clearSelection = useCallback(() => {
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.delete('id')
      return next
    })
  }, [setSearchParams])

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  const sendibodQuery = useQuery({
    queryKey: ['fjall-sendibod'],
    queryFn: fetchFjallSendibod,
    enabled: configured,
  })

  const settingsQuery = useQuery({
    queryKey: ['fjall-settings-sendibod'],
    queryFn: fetchFjallFullSettings,
    enabled: configured,
    staleTime: 60_000,
  })

  const messages = sendibodQuery.data ?? []
  const showSnippets = settingsQuery.data?.sendibod.showSnippets ?? true
  const autoMarkRead = settingsQuery.data?.sendibod.autoMarkRead ?? true
  const unreadCount = messages.filter((message) => !message.read).length

  const filtered = useMemo(() => {
    return messages.filter((message) => {
      if (!search.trim()) return true
      const query = search.toLowerCase()
      return (
        message.senderName.toLowerCase().includes(query) ||
        message.senderEmail.toLowerCase().includes(query) ||
        message.body.toLowerCase().includes(query)
      )
    })
  }, [messages, search])

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [filtered],
  )

  const selectedId = searchParams.get('id')
  const selectedMessage =
    sorted.find((message) => message.id === selectedId) ??
    messages.find((message) => message.id === selectedId) ??
    null

  const inspectorOpen = inspectorPinned || selectedId != null || showSettings
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  function selectSignal(id: string) {
    setSearchParams((params) => {
      const next = new URLSearchParams(params)
      next.set('id', id)
      return next
    })
  }

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    if (showSettings) {
      setShowSettings(false)
      return
    }
    if (selectedId == null) return
    clearSelection()
  }, [inspectorPinned, showSettings, selectedId, clearSelection])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  async function confirmDelete() {
    if (!deleteTarget) return
    await deleteFjallSendibod(deleteTarget.id)
    await queryClient.invalidateQueries({ queryKey: ['fjall-sendibod'] })
    if (selectedId === deleteTarget.id) clearSelection()
    setDeleteTarget(null)
  }

  return (
    <>
      <StudioLayout
        contextBar={
          <SendibodContextBar
            messageCount={sendibodQuery.data ? messages.length : undefined}
            unreadCount={sendibodQuery.data ? unreadCount : undefined}
            inspectorPinned={inspectorPinned}
            onInspectorPinnedChange={setInspectorPinned}
            onOpenSettings={() => setShowSettings(true)}
          />
        }
        canvas={
          statusQuery.isLoading ? (
            <TableSkeleton columns={3} rows={10} />
          ) : !configured ? (
            <DataNotConfiguredNotice />
          ) : (
            <div className="flex h-full flex-col">
              <SendibodFilterBar
                search={search}
                onSearchChange={setSearch}
                onRefresh={() => void sendibodQuery.refetch()}
                isRefreshing={sendibodQuery.isFetching}
              />
              {sendibodQuery.isLoading ? (
                <RailListSkeleton rows={10} />
              ) : (
                <SendibodMessageList
                  messages={sorted}
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
        onDismissInspector={dismissInspector}
        inspector={
          showSettings && settingsQuery.data?.sendibod ? (
            <SendibodSettingsForm
              initialSettings={settingsQuery.data.sendibod}
              onDone={() => setShowSettings(false)}
            />
          ) : selectedMessage ? (
            <SendibodMessageDetail message={selectedMessage} autoMarkRead={autoMarkRead} />
          ) : inspectorPinned ? (
            <InspectorEmptyState message="Select a message to read and reply." />
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

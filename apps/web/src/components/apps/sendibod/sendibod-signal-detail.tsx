import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Button } from '@/components/core/ui/button'
import { markCairnSignalRead, replyToCairnSignal, type CairnSignal } from '@/lib/data-api'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SendibodSignalDetail({
  signal,
  autoMarkRead,
}: {
  signal: CairnSignal
  autoMarkRead: boolean
}) {
  const queryClient = useQueryClient()
  const [reply, setReply] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!autoMarkRead || signal.read) return
    void markCairnSignalRead(signal.id)
      .then(() => queryClient.invalidateQueries({ queryKey: ['cairn-signals'] }))
      .catch(() => {})
  }, [signal.id, signal.read, autoMarkRead, queryClient])

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (!reply.trim()) return
    setSaving(true)
    try {
      await replyToCairnSignal(signal.id, reply.trim())
      setReply('')
      await queryClient.invalidateQueries({ queryKey: ['cairn-signals'] })
    } finally {
      setSaving(false)
    }
  }

  const thread = [
    {
      id: 'initial',
      body: signal.body,
      direction: 'INBOUND' as const,
      senderName: signal.senderName,
      createdAt: signal.createdAt,
    },
    ...signal.replies,
  ]

  return (
    <div className="flex h-full flex-col overflow-hidden">
      <div className="shrink-0 border-b border-border px-4 py-3">
        <h2 className="text-sm font-medium">{signal.senderName}</h2>
        <p className="text-xs text-muted-foreground">{signal.senderEmail}</p>
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
        {thread.map((message) => {
          const isOutbound = message.direction === 'OUTBOUND'
          return (
            <div
              key={message.id}
              className={`flex max-w-[85%] flex-col gap-1 ${isOutbound ? 'items-end self-end' : 'items-start'}`}
            >
              <span className="px-1 text-xs text-muted-foreground">
                {isOutbound ? 'You' : message.senderName}
              </span>
              <div
                className={`whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                  isOutbound
                    ? 'rounded-tr-none bg-primary text-primary-foreground'
                    : 'rounded-tl-none bg-muted'
                }`}
              >
                {message.body}
              </div>
              <span className="px-1 text-[10px] text-muted-foreground">
                {formatWhen(message.createdAt)}
              </span>
            </div>
          )
        })}
      </div>

      <form onSubmit={(event) => void onSubmit(event)} className="flex shrink-0 flex-col gap-2 border-t border-border p-4">
        <textarea
          value={reply}
          onChange={(event) => setReply(event.target.value)}
          placeholder="Write a reply…"
          rows={3}
          maxLength={2000}
          className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
        <div className="flex justify-end">
          <Button type="submit" size="sm" disabled={saving || !reply.trim()}>
            {saving ? 'Sending…' : 'Send reply'}
          </Button>
        </div>
      </form>
    </div>
  )
}

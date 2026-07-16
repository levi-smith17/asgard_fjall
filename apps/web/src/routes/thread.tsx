import { useState, useTransition } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Send } from 'lucide-react'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { RichTextContent } from '@/components/core/ui/rich-text-content'
import { getThread, sendThreadReply } from '@/lib/thread-api'
import { publicManifestPath } from '@/lib/public-manifest-path'
import { termsFor } from '@/lib/terminology'
import { cn } from '@/lib/utils'

function formatThreadDate(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatExpiry(value: string): string {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function plainTextToHtml(text: string): string {
  const trimmed = text.trim()
  if (!trimmed) return ''
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')
}

function ThreadReplyForm({
  token,
  wayfarerName,
}: {
  token: string
  wayfarerName: string | null
}) {
  const queryClient = useQueryClient()
  const [body, setBody] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function handleSend() {
    const html = plainTextToHtml(body)
    if (!html) return
    setError(null)
    startTransition(async () => {
      const result = await sendThreadReply(token, html)
      if (result.error) {
        setError(result.error)
        return
      }
      setSuccess(true)
      setBody('')
      void queryClient.invalidateQueries({ queryKey: ['thread', token] })
    })
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-center">
        <CheckCircle className="h-10 w-10 text-primary" aria-hidden />
        <div>
          <p className="font-medium">Reply sent</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {wayfarerName ?? 'They'} will see your reply shortly.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="block space-y-1.5">
        <span className="text-xs font-medium text-muted-foreground">Your reply</span>
        <textarea
          value={body}
          onChange={(event) => setBody(event.target.value)}
          rows={5}
          className="flex w-full rounded-md border border-border bg-input px-3 py-2 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          placeholder="Write your reply…"
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              handleSend()
            }
          }}
        />
      </label>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-muted-foreground">⌘ Enter to send</span>
        <Button type="button" onClick={handleSend} disabled={pending || !body.trim()}>
          <Send className="h-4 w-4" aria-hidden />
          {pending ? 'Sending…' : 'Send reply'}
        </Button>
      </div>
    </div>
  )
}

export function ThreadPage() {
  const { token } = useParams<{ token: string }>()
  const terms = termsFor('STANDARD')

  const { data, isError, isLoading } = useQuery({
    queryKey: ['thread', token],
    queryFn: () => getThread(token!),
    enabled: Boolean(token),
    retry: false,
  })

  if (!token) return <Navigate to="/" replace />
  if (isError) return <Navigate to="/" replace />

  if (isLoading || !data) {
    return (
      <div className="flex min-h-dvh items-center justify-center text-sm text-muted-foreground">
        Loading conversation…
      </div>
    )
  }

  const expired = !data.tokenExpiresAt || new Date(data.tokenExpiresAt) < new Date()
  const wayfarer = data.wayfarer
  const initials = wayfarer.name
    ? wayfarer.name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
    : '?'

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <StudioContextBar
        aria-label={terms.messages}
        title={terms.messages}
        actions={
          wayfarer.username ? (
            <Link
              to={publicManifestPath(wayfarer.username)}
              className="px-2 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              View {wayfarer.name ?? wayfarer.username}&apos;s {terms.resume.toLowerCase()}
            </Link>
          ) : undefined
        }
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div className="mx-auto flex max-w-2xl flex-col gap-8 px-4 pb-12 sm:px-6">
          <div className="flex items-center gap-4 pt-8">
            <Avatar
              src={wayfarer.image}
              alt={wayfarer.name ?? wayfarer.username ?? 'Profile'}
              fallback={initials}
              className="h-12 w-12"
            />
            <div>
              <h1 className="text-xl font-semibold">
                Conversation with {wayfarer.name ?? wayfarer.username}
              </h1>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {expired
                  ? 'This conversation link has expired.'
                  : `Link valid until ${formatExpiry(data.tokenExpiresAt!)}`}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex max-w-[80%] flex-col items-start gap-1">
              <span className="px-1 text-xs text-muted-foreground">{data.senderName}</span>
              <div className="whitespace-pre-wrap rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm">
                {data.body}
              </div>
              <span className="px-1 text-xs text-muted-foreground">
                {formatThreadDate(data.createdAt)}
              </span>
            </div>

            {data.replies.map((reply) => {
              const isOutbound = reply.direction === 'OUTBOUND'
              return (
                <div
                  key={reply.id}
                  className={cn(
                    'flex max-w-[80%] flex-col gap-1',
                    isOutbound ? 'items-end self-end' : 'items-start',
                  )}
                >
                  <span className="px-1 text-xs text-muted-foreground">
                    {isOutbound ? (wayfarer.name ?? 'Them') : reply.senderName}
                  </span>
                  {isOutbound ? (
                    <div className="rounded-2xl rounded-tr-none bg-primary px-4 py-2.5 text-sm text-primary-foreground">
                      <RichTextContent
                        html={reply.body}
                        className="prose-invert text-sm [&_*]:text-primary-foreground"
                      />
                    </div>
                  ) : (
                    <div className="rounded-2xl rounded-tl-none bg-muted px-4 py-2.5 text-sm">
                      <RichTextContent html={reply.body} className="text-sm" />
                    </div>
                  )}
                  <span className="px-1 text-xs text-muted-foreground">
                    {formatThreadDate(reply.createdAt)}
                  </span>
                </div>
              )
            })}
          </div>

          {expired ? (
            <div className="rounded-lg border border-border bg-muted/50 p-6 text-center">
              <p className="text-sm text-muted-foreground">
                This conversation link has expired. To continue,{' '}
                {wayfarer.username ? (
                  <Link
                    to={publicManifestPath(wayfarer.username, 'contact')}
                    className="underline underline-offset-4 hover:text-foreground"
                  >
                    send a new message
                  </Link>
                ) : (
                  'send a new message from the public contact page'
                )}
                .
              </p>
            </div>
          ) : (
            <ThreadReplyForm token={token} wayfarerName={wayfarer.name} />
          )}
        </div>
      </div>
    </div>
  )
}

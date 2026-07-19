import { Trash2 } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import type { FjallSendibod } from '@/lib/data-api'
import { useTerms } from '@/hooks/use-terminology'

function formatWhen(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function SendibodMessageList({
  messages,
  selectedId,
  showSnippets,
  onSelect,
  onDelete,
}: {
  messages: FjallSendibod[]
  selectedId: string | null
  showSnippets: boolean
  onSelect: (id: string) => void
  onDelete: (id: string, senderName: string) => void
}) {
  const terms = useTerms()
  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 px-4 py-16 text-center text-sm text-muted-foreground">
            <p>No {terms.messages.toLowerCase()} yet</p>
            <p className="text-xs">
              Contact-form messages from your public {terms.resume.toLowerCase()} will appear here.
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isSelected = selectedId === message.id
            return (
              <div
                key={message.id}
                data-inspectable
                className={`group flex cursor-pointer items-start justify-between border-b border-border/50 px-4 py-3 transition-colors ${
                  isSelected ? 'bg-primary/20' : 'hover:bg-muted/50'
                } ${!message.read ? 'font-medium' : ''}`}
                onClick={() => onSelect(message.id)}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <div className="flex items-center gap-2">
                    {!message.read ? (
                      <span className="h-2 w-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                    <span className="truncate text-sm">{message.senderName}</span>
                  </div>
                  <span className="truncate text-xs text-muted-foreground">{message.senderEmail}</span>
                  {showSnippets ? (
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground">{message.body}</span>
                  ) : null}
                  <span className="mt-1 text-[10px] text-muted-foreground">
                    {formatWhen(message.createdAt)}
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-2 h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100"
                  onClick={(event) => {
                    event.stopPropagation()
                    onDelete(message.id, message.senderName)
                  }}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

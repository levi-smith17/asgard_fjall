import { useState } from 'react'
import { ExternalLink, MapPin } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { useTerms } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export type SogurLaufOption = {
  id: string
  title: string
  url: string
  description?: string | null
}

export function SogurLaufarPicker({
  laufar,
  selectedId,
  onChange,
  greinName,
}: {
  laufar: SogurLaufOption[]
  selectedId: string | null
  onChange: (laufId: string | null) => void
  greinName: string
}) {
  const terms = useTerms()
  const [open, setOpen] = useState(false)
  const selected = laufar.find((lauf) => lauf.id === selectedId) ?? null

  if (laufar.length === 0) return null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className={cn(
            'h-8 shrink-0 gap-1.5 px-2 text-xs',
            selected && 'bg-primary/10 text-primary',
          )}
          title={terms.laufar}
        >
          <MapPin className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">{terms.laufar}</span>
          {selected ? <span className="max-w-[8rem] truncate">· {selected.title}</span> : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 overflow-hidden p-0" align="start" sideOffset={6}>
        <div className="flex items-center gap-2 border-b border-border px-3 py-2">
          <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <span className="text-xs font-medium">
            {greinName} {terms.laufar.toLowerCase()}
          </span>
          <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">
            {laufar.length}
          </span>
        </div>
        <div className="max-h-72 overflow-y-auto">
          <button
            type="button"
            onClick={() => {
              onChange(null)
              setOpen(false)
            }}
            className={cn(
              'flex w-full px-3 py-2 text-left text-xs transition-colors hover:bg-muted/50',
              !selectedId && 'bg-primary/10',
            )}
          >
            No {terms.laufarSingular.toLowerCase()}
          </button>
          {laufar.map((lauf) => (
            <div
              key={lauf.id}
              className={cn(
                'flex items-start gap-2 border-t border-border px-3 py-2 transition-colors hover:bg-muted/50',
                selectedId === lauf.id && 'bg-primary/10',
              )}
            >
              <button
                type="button"
                onClick={() => {
                  onChange(lauf.id)
                  setOpen(false)
                }}
                className="min-w-0 flex-1 text-left"
              >
                <p className="truncate text-xs font-medium">{lauf.title}</p>
                {lauf.description ? (
                  <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                    {lauf.description}
                  </p>
                ) : null}
              </button>
              <a
                href={lauf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 pt-0.5 text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                title="Open link"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  )
}

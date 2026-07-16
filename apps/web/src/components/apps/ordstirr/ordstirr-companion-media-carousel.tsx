import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { publicCompanionMediaUrl } from '@/lib/public-media-url'

export type OrdstirrCompanionMediaItem = {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO' | string
  caption?: string | null
  order?: number
}

/** Carousel matching the public Ferd Min companion media presentation. */
export function OrdstirrCompanionMediaCarousel({
  media,
  name,
  className,
}: {
  media: OrdstirrCompanionMediaItem[]
  name: string
  className?: string
}) {
  const ordered = useMemo(
    () =>
      [...media].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [media],
  )
  const [index, setIndex] = useState(0)
  const current = ordered[Math.min(index, Math.max(ordered.length - 1, 0))]

  if (ordered.length === 0 || !current) return null

  return (
    <div className={className}>
      <div className="relative">
        <div className="flex h-72 items-center justify-center overflow-hidden rounded-lg bg-transparent sm:h-96">
          {String(current.type).toUpperCase() === 'VIDEO' ? (
            <video
              key={current.id}
              src={publicCompanionMediaUrl(current.key)}
              className="h-full w-full object-contain"
              controls
            />
          ) : (
            <img
              key={current.id}
              src={publicCompanionMediaUrl(current.key)}
              alt={current.caption ?? name}
              className="h-full w-full object-contain"
            />
          )}
        </div>
        {ordered.length > 1 ? (
          <>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute left-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-muted/90 opacity-90 hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                setIndex((value) => (value - 1 + ordered.length) % ordered.length)
              }}
              aria-label="Previous media"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 bg-muted/90 opacity-90 hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation()
                setIndex((value) => (value + 1) % ordered.length)
              }}
              aria-label="Next media"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </>
        ) : null}
      </div>
      {current.caption ? (
        <p className="mt-2 text-center text-xs text-muted-foreground">{current.caption}</p>
      ) : null}
    </div>
  )
}

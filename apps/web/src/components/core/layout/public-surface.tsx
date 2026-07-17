import { ValknutWatermark } from '@/components/core/icons/valknut-watermark'
import { cn } from '@/lib/utils'

/** Full-viewport chrome for ungated visitor pages (no AppShell sidebar). */
export function PublicSurface({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      data-public-surface
      className={cn(
        'relative flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground',
        'print:h-auto print:min-h-0 print:overflow-visible',
        className,
      )}
    >
      <ValknutWatermark />
      <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">{children}</div>
    </div>
  )
}

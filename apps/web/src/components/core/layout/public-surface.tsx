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
        'flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground',
        'print:h-auto print:min-h-0 print:overflow-visible',
        className,
      )}
    >
      {children}
    </div>
  )
}

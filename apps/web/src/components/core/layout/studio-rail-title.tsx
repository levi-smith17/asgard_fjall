import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

/** Title row for studio left rails — icon + label. */
export function StudioRailTitle({
  icon: Icon,
  children,
  className,
}: {
  icon: LucideIcon
  children: React.ReactNode
  className?: string
}) {
  return (
    <span className={cn('flex min-w-0 items-center gap-2 text-sm font-semibold text-foreground', className)}>
      <Icon className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <span className="truncate">{children}</span>
    </span>
  )
}

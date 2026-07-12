import { cn } from '@/lib/utils'

export function Avatar({ src, alt, fallback, className }: { src?: string | null; alt?: string; fallback: string; className?: string }) {
  const initials = fallback.slice(0, 2).toUpperCase()
  return (
    <span className={cn('relative inline-flex h-8 w-8 shrink-0 overflow-hidden rounded-lg bg-muted', className)}>
      {src ? (
        <img src={src} alt={alt ?? ''} className="h-full w-full object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-medium text-muted-foreground">{initials}</span>
      )}
    </span>
  )
}

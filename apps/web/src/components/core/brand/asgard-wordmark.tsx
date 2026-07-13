import { cn } from '@/lib/utils'

export function AsgardWordmark({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        'block text-base font-bold uppercase tracking-[0.34em] text-primary',
        className,
      )}
    >
      Asgard
    </span>
  )
}

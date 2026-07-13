import { Valknut } from '@/components/core/icons/valknut'

/**
 * Large faded valknut behind page content — decorative only, non-interactive.
 */
export function ValknutWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Valknut
        className="absolute top-1/2 left-1/2 h-[min(72vmin,42rem)] w-[min(72vmin,42rem)] -translate-x-1/2 -translate-y-1/2 text-foreground opacity-[0.035] dark:opacity-[0.055]"
      />
    </div>
  )
}

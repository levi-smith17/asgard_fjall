import { Valknut } from '@/components/core/icons/valknut'

/**
 * Large faded valknut behind page content — decorative only, non-interactive.
 * Horizontally centered in the main pane; vertically centered on the viewport.
 * -translate-y-[41%] optically centers the glyph (ink sits high in the 24 viewBox).
 */
export function ValknutWatermark() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-0 overflow-hidden"
      aria-hidden
    >
      <Valknut
        className="absolute left-1/2 top-[50vh] h-[min(92vmin,56rem)] w-[min(92vmin,56rem)] -translate-x-1/2 -translate-y-[41%] text-foreground opacity-[0.035] dark:opacity-[0.055]"
      />
    </div>
  )
}

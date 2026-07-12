import { forwardRef } from 'react'
import { createLucideIcon, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Norse valknut — three interlocking triangular bands (tricursal / Borromean form).
 * Path is visually centered in the 24×24 viewBox so `animate-spin` stays on-axis.
 * Prefer {@link ValknutSpin} for always-spinning refresh/loading affordances.
 */
const ValknutGlyph = createLucideIcon('valknut', [
  [
    'path',
    {
      d: 'M3.36 18.53L17.96 18.53L16.02 15.15L14.79 15.15L16.13 17.47L5.19 17.47L6.53 15.15L5.31 15.15ZM7.37 11.58L8.60 11.58L10.66 8.01L12.72 11.58L13.95 11.58L10.66 5.88ZM10.66 1.25L3.36 13.90L7.26 13.90L7.87 12.84L5.19 12.84L10.66 3.37L12.00 5.69L12.62 4.63ZM14.68 8.20L14.06 9.27L16.13 12.84L12.00 12.84L11.39 13.90L17.96 13.90ZM21.98 16.22L14.68 3.57L12.72 6.95L13.34 8.01L14.68 5.69L20.14 15.15L17.47 15.15L18.08 16.22ZM13.95 16.22L13.34 15.15L9.21 15.15L11.28 11.58L10.66 10.52L7.37 16.22Z',
      fill: 'currentColor',
      stroke: 'none',
      fillRule: 'evenodd',
      key: 'vk',
    },
  ],
])

export const Valknut = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <ValknutGlyph ref={ref} className={cn('origin-center', className)} {...props} />
  ),
)
Valknut.displayName = 'Valknut'

/** Valknut that always rotates — drop-in for refresh/loading affordances. */
export const ValknutSpin = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <Valknut ref={ref} className={cn('animate-spin', className)} {...props} />
  ),
)
ValknutSpin.displayName = 'ValknutSpin'

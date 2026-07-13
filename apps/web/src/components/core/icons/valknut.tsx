import { forwardRef } from 'react'
import { createLucideIcon, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Norse valknut — three interlocking triangular bands (tricursal / Borromean form).
 * Used as a decorative watermark; not for loaders/refresh controls.
 */
const ValknutGlyph = createLucideIcon('valknut', [
  [
    'path',
    {
      d: 'M2.75 18.99L18.38 18.99L16.30 15.37L14.98 15.37L16.42 17.85L4.72 17.85L6.15 15.37L4.84 15.37ZM7.05 11.55L8.36 11.55L10.57 7.73L12.77 11.55L14.08 11.55L10.57 5.46ZM10.57 0.50L2.75 14.03L6.93 14.03L7.58 12.89L4.72 12.89L10.57 2.77L12.00 5.25L12.66 4.12ZM14.86 7.94L14.20 9.07L16.42 12.89L12.00 12.89L11.35 14.03L18.38 14.03ZM22.68 16.51L14.86 2.98L12.77 6.60L13.43 7.73L14.86 5.25L20.71 15.37L17.85 15.37L18.50 16.51ZM14.08 16.51L13.43 15.37L9.02 15.37L11.23 11.55L10.57 10.42L7.05 16.51Z',
      fill: 'currentColor',
      stroke: 'none',
      fillRule: 'evenodd',
      key: 'vk',
    },
  ],
])

export const Valknut = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <ValknutGlyph ref={ref} className={cn(className)} {...props} />
  ),
)
Valknut.displayName = 'Valknut'

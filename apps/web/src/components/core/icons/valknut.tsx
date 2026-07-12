import { forwardRef } from 'react'
import { createLucideIcon, type LucideProps } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Norse valknut (three interlocking triangles) in Lucide stroke style.
 * Use with `animate-spin`, or prefer {@link ValknutSpin} for refresh/loading.
 */
export const Valknut = createLucideIcon('valknut', [
  ['path', { d: 'M12 3.56 19.07 15.79 4.93 15.79Z', key: 'vk-a' }],
  ['path', { d: 'M9.32 8.21 16.38 20.44 2.25 20.44Z', key: 'vk-b' }],
  ['path', { d: 'M14.68 8.21 21.75 20.44 7.62 20.44Z', key: 'vk-c' }],
])

/** Valknut that always rotates — drop-in for refresh/loading affordances. */
export const ValknutSpin = forwardRef<SVGSVGElement, LucideProps>(
  ({ className, ...props }, ref) => (
    <Valknut ref={ref} className={cn('animate-spin', className)} {...props} />
  ),
)
ValknutSpin.displayName = 'ValknutSpin'

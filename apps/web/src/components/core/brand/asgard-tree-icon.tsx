import { useId } from 'react'
import asgardTreeMaskSrc from '@/assets/asgard-tree-transparent.png'
import { cn } from '@/lib/utils'

/** Tree mark from brand mockup — alpha mask, no background; fill via currentColor. */
export function AsgardTreeIcon({
  className,
  style,
}: {
  className?: string
  style?: React.CSSProperties
}) {
  const maskId = `asgard-tree-${useId().replace(/:/g, '')}`

  return (
    <svg
      viewBox="0 0 495 538"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Asgard"
      className={cn('shrink-0 text-primary', className)}
      style={style}
    >
      <title>Asgard</title>
      <defs>
        <mask
          id={maskId}
          maskUnits="userSpaceOnUse"
          maskContentUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="495"
          height="538"
          style={{ maskType: 'alpha' }}
        >
          <image
            href={asgardTreeMaskSrc}
            width="495"
            height="538"
            preserveAspectRatio="xMidYMid meet"
          />
        </mask>
      </defs>
      <rect width="495" height="538" fill="currentColor" mask={`url(#${maskId})`} />
    </svg>
  )
}

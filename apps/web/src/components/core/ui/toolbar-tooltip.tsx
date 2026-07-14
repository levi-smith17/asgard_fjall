import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'

function canHover(): boolean {
  if (typeof window === 'undefined') return true
  return window.matchMedia('(hover: hover) and (pointer: fine)').matches
}

const EDGE = 8

function clampTooltipPosition(
  top: number,
  left: number,
  width: number,
  height: number,
  placement: 'above' | 'below' | 'right',
): { top: number; left: number; transform: string } {
  const maxLeft = window.innerWidth - EDGE
  const maxTop = window.innerHeight - EDGE
  let clampedLeft = Math.min(Math.max(left, EDGE), maxLeft)
  let clampedTop = Math.min(Math.max(top, EDGE), maxTop)

  let transform = placement === 'right' ? 'translateY(-50%)' : 'translateX(-50%)'
  if (placement === 'above') transform = 'translate(-50%, -100%)'

  // If centered transform would overflow, shift horizontally/vertically.
  if (placement !== 'right') {
    const half = width / 2
    if (clampedLeft - half < EDGE) {
      clampedLeft = EDGE + half
    } else if (clampedLeft + half > maxLeft) {
      clampedLeft = maxLeft - half
    }
    if (placement === 'above' && clampedTop - height < EDGE) {
      clampedTop = EDGE + height
    } else if (placement === 'below' && clampedTop + height > maxTop) {
      clampedTop = maxTop - height
    }
  } else {
    if (clampedTop - height / 2 < EDGE) clampedTop = EDGE + height / 2
    if (clampedTop + height / 2 > maxTop) clampedTop = maxTop - height / 2
    if (clampedLeft + width > maxLeft) {
      clampedLeft = Math.max(EDGE, left - width - 16)
    }
  }

  return { top: clampedTop, left: clampedLeft, transform }
}

export function ToolbarTooltip({
  label,
  children,
  className,
  placement = 'below',
}: {
  label: string
  children: React.ReactNode
  className?: string
  placement?: 'above' | 'below' | 'right'
}) {
  const triggerRef = useRef<HTMLDivElement>(null)
  const tipRef = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState<{ top: number; left: number; transform: string } | null>(
    null,
  )
  const above = placement === 'above'
  const right = placement === 'right'

  const updatePosition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const tip = tipRef.current
    const width = tip?.offsetWidth ?? 120
    const height = tip?.offsetHeight ?? 32

    let top: number
    let left: number
    if (right) {
      top = rect.top + rect.height / 2
      left = rect.right + 8
    } else {
      top = above ? rect.top - 8 : rect.bottom + 8
      left = rect.left + rect.width / 2
    }
    setPosition(clampTooltipPosition(top, left, width, height, placement))
  }, [above, placement, right])

  const hide = useCallback(() => setVisible(false), [])

  const show = useCallback(() => {
    if (!canHover()) return
    updatePosition()
    setVisible(true)
  }, [updatePosition])

  useLayoutEffect(() => {
    if (!visible) return
    updatePosition()
  }, [visible, label, updatePosition])

  useEffect(() => {
    if (!visible) return

    const onScroll = () => hide()
    const onPointerDown = () => hide()
    const onResize = () => updatePosition()

    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('pointerdown', onPointerDown, true)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('pointerdown', onPointerDown, true)
      window.removeEventListener('resize', onResize)
    }
  }, [hide, updatePosition, visible])

  return (
    <>
      <div
        ref={triggerRef}
        className={cn('flex items-center', className)}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
      >
        {children}
      </div>
      {visible &&
        position &&
        createPortal(
          <span
            ref={tipRef}
            role="tooltip"
            className={cn(
              'pointer-events-none fixed z-[300] whitespace-nowrap',
              'rounded-md border border-border bg-card px-2.5 py-1.5 text-xs font-medium text-foreground shadow-md',
            )}
            style={{ top: position.top, left: position.left, transform: position.transform }}
          >
            {label}
          </span>,
          document.body,
        )}
    </>
  )
}

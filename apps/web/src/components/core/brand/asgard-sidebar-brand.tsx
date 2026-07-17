import { AsgardTreeIcon } from '@/components/core/brand/asgard-tree-icon'
import { AsgardWordmark } from '@/components/core/brand/asgard-wordmark'
import { useTerminology } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function AsgardSidebarBrand({
  narrow,
  subtitle,
  size = 'default',
}: {
  narrow: boolean
  /** Overrides the product subtitle (e.g. public profile name). */
  subtitle?: string
  /** Public apex chrome uses a larger brand to match the wider rail. */
  size?: 'default' | 'public'
}) {
  const { terms } = useTerminology()
  const subtitleText = subtitle ?? terms.productSubtitle
  const isPublic = size === 'public' && !narrow

  return (
    <div
      className={cn(
        'box-border flex shrink-0 items-center border-b border-sidebar-border px-2',
        narrow
          ? 'h-[var(--sidebar-brand-height-collapsed)] max-h-[var(--sidebar-brand-height-collapsed)] justify-center'
          : isPublic
            ? 'h-32 max-h-32 justify-start gap-3 px-4'
            : 'h-[var(--sidebar-brand-height)] max-h-[var(--sidebar-brand-height)] justify-start gap-3 px-4',
      )}
    >
      <AsgardTreeIcon
        className={cn(
          'w-auto',
          narrow ? 'h-9' : isPublic ? 'h-20' : 'h-[4.5rem]',
        )}
      />
      {!narrow ? (
        <div className="min-w-0 leading-none">
          <AsgardWordmark
            className={cn('text-primary', isPublic && 'text-lg')}
          />
          <p
            className={cn(
              'mt-2 font-medium uppercase tracking-[0.22em] text-muted-foreground',
              isPublic ? 'text-sm' : 'text-xs',
            )}
          >
            {subtitleText}
          </p>
        </div>
      ) : null}
    </div>
  )
}

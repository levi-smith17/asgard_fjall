import { AsgardTreeIcon } from '@/components/core/brand/asgard-tree-icon'
import { AsgardWordmark } from '@/components/core/brand/asgard-wordmark'
import { useTerminology } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function AsgardSidebarBrand({
  narrow,
  subtitle,
}: {
  narrow: boolean
  /** Overrides the product subtitle (e.g. public profile name). */
  subtitle?: string
}) {
  const { terms } = useTerminology()
  const subtitleText = subtitle ?? terms.productSubtitle

  return (
    <div
      className={cn(
        'box-border flex shrink-0 items-center border-b border-sidebar-border px-2',
        narrow
          ? 'h-[var(--sidebar-brand-height-collapsed)] max-h-[var(--sidebar-brand-height-collapsed)] justify-center'
          : 'h-[var(--sidebar-brand-height)] max-h-[var(--sidebar-brand-height)] justify-start gap-3 px-4',
      )}
    >
      <AsgardTreeIcon className={cn('w-auto', narrow ? 'h-9' : 'h-[4.5rem]')} />
      {!narrow ? (
        <div className="min-w-0 leading-none">
          {terms.productName === 'Cairn' ? (
            <span className="block text-base font-bold uppercase tracking-[0.34em] text-primary">
              Cairn
            </span>
          ) : (
            <AsgardWordmark className="text-primary" />
          )}
          <p className="mt-2 text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
            {subtitleText}
          </p>
        </div>
      ) : null}
    </div>
  )
}

import { cn } from '@/lib/utils'

export const INSPECTOR_CHROME_CLASS =
  'box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-border px-4'

export function InspectorChrome({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn(INSPECTOR_CHROME_CLASS, className)}>{children}</div>
}

export function InspectorChromeTitle({ eyebrow, title, meta }: { eyebrow?: React.ReactNode; title: React.ReactNode; meta?: React.ReactNode }) {
  return (
    <div className="min-w-0 flex-1 leading-tight">
      {eyebrow ? <p className="truncate text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{eyebrow}</p> : null}
      <p className="truncate text-sm font-semibold text-foreground">{title}</p>
      {meta}
    </div>
  )
}

/** Standard empty/idle inspector: Inspector / No Selection + centered help. */
export function InspectorEmptyState({ message }: { message: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow="Inspector" title="No Selection" />
      </InspectorChrome>
      <div className="flex min-h-0 flex-1 items-center justify-center px-5">
        <p className="text-center text-sm leading-relaxed text-muted-foreground">{message}</p>
      </div>
    </div>
  )
}

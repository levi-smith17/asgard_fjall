import { cn } from '@/lib/utils'

function Block({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded bg-muted', className)} />
}

export function TableSkeleton({
  rows = 12,
  columns = 5,
  className,
}: {
  rows?: number
  columns?: number
  className?: string
}) {
  return (
    <div className={cn('flex min-h-0 flex-1 flex-col overflow-hidden', className)}>
      <div className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, index) => (
            <Block key={index} className="h-3 flex-1 max-w-[8rem]" />
          ))}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        {Array.from({ length: rows }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 border-b border-border px-4 py-3 sm:px-6">
            {Array.from({ length: columns }).map((_, col) => (
              <Block
                key={col}
                className={cn('h-3.5 flex-1', col === 0 && 'max-w-[10rem]', col === columns - 1 && 'max-w-[6rem]')}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function RailListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: rows }).map((_, index) => (
        <Block key={index} className="h-9 w-full rounded-lg" />
      ))}
    </div>
  )
}

export function FormFieldsSkeleton({ fields = 5 }: { fields?: number }) {
  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 px-4 py-6 sm:px-6">
      {Array.from({ length: fields }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Block className="h-3 w-24" />
          <Block className="h-9 w-full" />
        </div>
      ))}
      <Block className="h-9 w-28" />
    </div>
  )
}

export function RailCatalogSkeleton({ rows = 8, titleWidth = 'w-20' }: { rows?: number; titleWidth?: string }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="flex items-center gap-2 rounded-lg border border-border bg-card p-2">
          <Block className={cn('h-3 flex-1', titleWidth)} />
          <Block className="h-3 w-6 shrink-0" />
        </div>
      ))}
    </div>
  )
}

export function SogurCanvasSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 shrink-0 items-center gap-3 border-b border-border px-4">
        <Block className="h-4 w-24" />
        <Block className="h-4 w-4 rounded-full" />
        <Block className="ml-auto h-7 w-20" />
      </div>
      <div className="flex-1 px-6 py-8 space-y-4">
        {Array.from({ length: 12 }).map((_, i) => <Block key={i} className={cn('h-4', i % 3 === 2 ? 'w-2/3' : 'w-full')} />)}
      </div>
    </div>
  )
}

export function CalendarSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
        <Block className="h-7 w-7" />
        <Block className="h-5 w-32" />
        <Block className="ml-auto h-7 w-24" />
      </div>
      <div className="grid grid-cols-7 gap-px border-b border-border bg-border">
        {Array.from({ length: 7 }).map((_, i) => <Block key={i} className="h-8 bg-card" />)}
      </div>
      <div className="grid grid-cols-7 flex-1 gap-px bg-border">
        {Array.from({ length: 35 }).map((_, i) => <Block key={i} className="h-24 bg-card" />)}
      </div>
    </div>
  )
}

export function OrdstirrPageSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="hidden w-[260px] shrink-0 flex-col border-r border-border lg:flex">
        <OrdstirrSectionsRailSkeleton />
      </div>
      <OrdstirrCanvasSkeleton />
    </div>
  )
}

/** Canvas-only skeleton for the Ordstirr editor (rail provided separately). */
export function OrdstirrCanvasSkeleton() {
  return (
    <div className="min-w-0 flex-1 space-y-6 overflow-hidden p-6">
      <div className="flex items-center gap-4">
        <Block className="h-20 w-20 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Block className="h-6 w-48" />
          <Block className="h-4 w-64 max-w-full" />
        </div>
      </div>
      <div className="space-y-3">
        <Block className="h-4 w-24" />
        <Block className="h-4 w-full max-w-xl" />
        <Block className="h-4 w-5/6 max-w-lg" />
        <Block className="h-28 w-full max-w-2xl" />
      </div>
      <div className="space-y-3">
        <Block className="h-4 w-28" />
        <Block className="h-16 w-full max-w-2xl" />
        <Block className="h-16 w-full max-w-2xl" />
      </div>
    </div>
  )
}

/** Sections rail skeleton matching editor Ordstirr rail chrome. */
export function OrdstirrSectionsRailSkeleton() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
        <Block className="h-4 w-24" />
        <div className="flex items-center gap-0.5">
          <Block className="h-7 w-7 rounded-md" />
          <Block className="h-7 w-7 rounded-md" />
        </div>
      </div>
      <div className="min-h-0 flex-1 space-y-3 overflow-hidden px-2 py-3">
        <Block className="mx-1 h-2.5 w-16" />
        <RailListSkeleton rows={5} />
        <div className="my-1 border-t border-border" />
        <Block className="mx-1 h-2.5 w-20" />
        <RailListSkeleton rows={3} />
      </div>
    </div>
  )
}

/**
 * Public Ordstirr canvas skeleton — keeps the real public sections rail;
 * only the document column is pulsing.
 */
export function PublicOrdstirrCanvasSkeleton({
  view = 'manifest',
}: {
  view?: 'manifest' | 'journey' | 'contact'
}) {
  if (view === 'contact') {
    return (
      <div className="flex min-h-0 flex-1 items-start justify-center overflow-hidden px-4 py-8">
        <div className="flex w-full max-w-md flex-col gap-6 rounded-xl bg-muted/50 p-6">
          <div className="flex items-center gap-4">
            <Block className="h-16 w-16 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Block className="h-6 w-40" />
              <Block className="h-3.5 w-56 max-w-full" />
            </div>
          </div>
          <FormFieldsSkeleton fields={4} />
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-10 px-6 py-6">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Block className="h-20 w-20 shrink-0 rounded-full" />
          <div className="min-w-0 flex-1 space-y-2">
            <Block className="h-7 w-48" />
            <Block className="h-4 w-64 max-w-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-4">
          <Block className="h-4 w-28" />
          <Block className="h-4 w-32" />
          <Block className="h-4 w-24" />
        </div>
      </div>
      {view === 'journey' ? (
        <>
          <div className="space-y-3">
            <Block className="h-5 w-28" />
            <Block className="h-4 w-full" />
            <Block className="h-4 w-5/6" />
            <Block className="h-4 w-4/5" />
          </div>
          <div className="space-y-4">
            <Block className="h-5 w-32" />
            <Block className="h-64 w-full rounded-lg" />
            <Block className="h-64 w-full rounded-lg" />
          </div>
        </>
      ) : (
        <>
          <div className="space-y-3">
            <Block className="h-5 w-28" />
            <div className="space-y-4 border-l-2 border-border pl-4">
              <Block className="h-4 w-40" />
              <Block className="h-3.5 w-56" />
              <Block className="h-3.5 w-full max-w-lg" />
            </div>
            <div className="space-y-4 border-l-2 border-border pl-4">
              <Block className="h-4 w-36" />
              <Block className="h-3.5 w-48" />
              <Block className="h-3.5 w-5/6 max-w-md" />
            </div>
          </div>
          <div className="space-y-3">
            <Block className="h-5 w-20" />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              <Block className="h-28 w-full rounded-lg" />
              <Block className="h-28 w-full rounded-lg" />
              <Block className="h-28 w-full rounded-lg" />
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function InspectorChromeSkeleton({ lines = 1 }: { lines?: number }) {
  return (
    <div className="box-border flex h-14 min-h-14 max-h-14 shrink-0 items-center gap-2 overflow-hidden border-b border-border px-4">
      <div className="min-w-0 flex-1 space-y-1">
        {lines > 1 ? <Block className="h-2.5 w-16" /> : null}
        <Block className="h-3.5 w-24" />
      </div>
    </div>
  )
}

export function DataToolbarSkeleton({
  className,
  center = false,
  leading,
  trailing,
}: {
  className?: string
  center?: boolean
  leading?: React.ReactNode
  trailing?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'shrink-0 border-b border-border px-3 sm:px-6 lg:px-8',
        'box-border flex h-14 min-h-14 max-h-14 items-center',
        className,
      )}
    >
      <div className="flex w-full items-center justify-between gap-2 lg:grid lg:grid-cols-[1fr_auto_1fr] lg:items-center lg:gap-3">
        <div className="flex min-w-0 items-center gap-1 justify-self-start">
          {leading ?? (
            <>
              <Block className="h-8 w-8" />
              <Block className="h-8 w-14" />
              <Block className="h-8 w-8" />
            </>
          )}
        </div>
        {center ? (
          <Block className="hidden h-3 w-32 lg:mx-auto lg:block" />
        ) : (
          <div className="hidden lg:block" aria-hidden />
        )}
        <div className="flex shrink-0 items-center justify-end gap-1.5 sm:gap-2 lg:justify-self-end">
          {trailing ?? (
            <>
              <Block className="h-8 w-[5.5rem]" />
              <Block className="hidden h-8 w-44 sm:block" />
              <Block className="h-8 w-8" />
              <Block className="h-8 w-8" />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function StarfieldSkeleton() {
  return (
    <div className="flex min-h-0 flex-1 overflow-hidden">
      <div className="hidden w-[260px] shrink-0 flex-col border-r border-border lg:flex">
        <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-3">
          <Block className="h-4 w-20" />
          <Block className="h-7 w-7 rounded-md" />
        </div>
        <div className="min-h-0 flex-1 space-y-1 overflow-hidden p-2">
          {Array.from({ length: 8 }).map((_, index) => (
            <Block key={index} className="h-9 w-full rounded-lg" />
          ))}
        </div>
      </div>
      <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        <DataToolbarSkeleton
          leading={<span className="sr-only">Loading</span>}
          trailing={
            <>
              <Block className="h-8 w-8" />
              <Block className="h-8 w-8" />
              <Block className="h-8 w-8" />
            </>
          }
        />
        <div className="relative min-h-0 flex-1 bg-background">
          <Block className="absolute inset-0 rounded-none opacity-40" />
        </div>
      </div>
    </div>
  )
}

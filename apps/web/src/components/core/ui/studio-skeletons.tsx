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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 shrink-0 items-center gap-3 border-b border-border px-6">
        <Block className="h-5 w-28" />
        <Block className="ml-auto h-7 w-20" />
      </div>
      <div className="flex min-h-0 flex-1">
        <div className="w-56 shrink-0 border-r border-border p-4 space-y-2">
          {Array.from({ length: 7 }).map((_, i) => <Block key={i} className="h-8 w-full rounded" />)}
        </div>
        <div className="flex-1 px-8 py-6 space-y-6">
          <Block className="h-8 w-48" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <Block key={i} className={cn('h-24 w-full rounded-lg', i % 2 === 1 && 'opacity-60')} />)}
          </div>
        </div>
      </div>
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

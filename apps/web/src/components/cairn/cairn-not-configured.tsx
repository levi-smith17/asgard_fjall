import { cn } from '@/lib/utils'

export function CairnNotConfiguredNotice({
  title = 'Cairn not configured',
  detail,
  layout = 'centered',
  className,
}: {
  title?: string
  detail?: string
  layout?: 'centered' | 'inline'
  className?: string
}) {
  const hint =
    detail ??
    'Set VITE_CAIRN_API_URL and ensure your Cairn account is accessible. Log in to grant access.'

  return (
    <div
      className={cn(
        layout === 'centered' &&
          'flex flex-1 flex-col items-center justify-center gap-2 px-4 text-center sm:px-6',
        layout === 'inline' && 'space-y-1 border-b border-border px-4 py-2 text-xs',
        className,
      )}
    >
      <p className={cn(layout === 'centered' ? 'text-sm text-destructive' : 'text-warning')}>
        {title}
      </p>
      <p
        className={cn(
          layout === 'centered' ? 'max-w-md text-xs text-muted-foreground' : 'text-muted-foreground',
        )}
      >
        {hint}
      </p>
    </div>
  )
}

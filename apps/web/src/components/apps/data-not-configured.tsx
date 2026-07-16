import { CairnApiError } from '@/lib/data-client'
import { cn } from '@/lib/utils'

export function DataNotConfiguredNotice({
  title = 'Data API not configured',
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
    'Sign in with your Cognito account for live data. Fjall calls the data API with your session token — there is no separate API token to configure.'

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

export function dataQueryErrorProps(error: unknown, fallback: string) {
  const apiError = error instanceof CairnApiError ? error : null
  const isConfigError = apiError?.status === 503
  const isTokenError = apiError?.status === 401 || apiError?.status === 403
  return {
    title: apiError?.message ?? (error instanceof Error ? error.message : fallback),
    detail: isConfigError
      ? 'The data API is unreachable or not configured.'
      : isTokenError
        ? 'Sign in with Cognito to access live data.'
        : undefined,
    isConfigError,
    isTokenError,
  }
}

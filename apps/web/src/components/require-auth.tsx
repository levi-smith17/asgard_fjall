import { Navigate, Outlet } from 'react-router-dom'
import { ValknutSpin } from '@/components/core/icons/valknut'
import { useAuth } from '@/hooks/use-auth'

/** When Cognito is configured, require a session. Otherwise allow shell browsing. */
export function RequireAuth() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-[var(--muted-foreground)]">
        <ValknutSpin className="h-5 w-5" aria-hidden />
        Checking session…
      </div>
    )
  }

  if (auth.configured && !auth.user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

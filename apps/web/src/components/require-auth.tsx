import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'

/** When Cognito is configured, require a session. Otherwise allow shell browsing. */
export function RequireAuth() {
  const auth = useAuth()

  if (auth.loading) {
    return (
      <div className="flex min-h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
        Checking session…
      </div>
    )
  }

  if (auth.configured && !auth.user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

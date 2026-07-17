import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
import { AsgardTreeIcon } from '@/components/core/brand/asgard-tree-icon'
import { AsgardWordmark } from '@/components/core/brand/asgard-wordmark'
import { Button } from '@/components/core/ui/button'
import { Input } from '@/components/core/ui/input'
import { useAuth } from '@/hooks/use-auth'
import {
  fetchAuthStatus,
  loginWithPasskey,
  registerPasskey,
} from '@/lib/webauthn-client'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [deviceName, setDeviceName] = useState('MacBook')
  const [passkeysConfigured, setPasskeysConfigured] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const redirectTo =
    (location.state as { from?: string } | null)?.from?.replace(/\/login$/, '') || '/hlidskjalf'

  useEffect(() => {
    void fetchAuthStatus()
      .then((status) => setPasskeysConfigured(status.passkeysConfigured))
      .catch(() => setPasskeysConfigured(null))
  }, [])

  if (auth.loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Checking session…
      </div>
    )
  }

  if (auth.status === 'authenticated') {
    return <Navigate to={redirectTo} replace />
  }

  async function handleRegister() {
    setSubmitting(true)
    setError(null)
    try {
      await registerPasskey(deviceName.trim() || undefined)
      await auth.refresh()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleLogin() {
    setSubmitting(true)
    setError(null)
    try {
      await loginWithPasskey()
      await auth.refresh()
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Passkey sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="flex flex-col items-center gap-3 text-center">
          <AsgardTreeIcon className="h-16 w-auto" />
          <div className="space-y-1.5 leading-none">
            <AsgardWordmark className="text-foreground" />
            <p className="text-xs font-medium uppercase tracking-[0.22em] text-muted-foreground">
              Fjall
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            {passkeysConfigured
              ? 'Sign in with your passkey'
              : passkeysConfigured === null
                ? 'Passkey auth offline — start apps/auth'
                : 'Register your first passkey'}
          </p>
        </div>

        {passkeysConfigured !== null ? (
          !passkeysConfigured ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="deviceName" className="text-sm font-medium text-foreground">
                  Device name
                </label>
                <Input
                  id="deviceName"
                  value={deviceName}
                  onChange={(event) => setDeviceName(event.target.value)}
                  placeholder="MacBook"
                />
              </div>
              <Button
                type="button"
                className="w-full"
                disabled={submitting}
                onClick={() => void handleRegister()}
              >
                <KeyRound className="h-4 w-4" />
                {submitting ? 'Registering…' : 'Create passkey'}
              </Button>
            </div>
          ) : (
            <Button
              type="button"
              className="w-full"
              disabled={submitting}
              onClick={() => void handleLogin()}
            >
              <KeyRound className="h-4 w-4" />
              {submitting ? 'Signing in…' : 'Sign in with passkey'}
            </Button>
          )
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}

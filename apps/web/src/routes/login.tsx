import { useEffect, useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { KeyRound, Loader2 } from 'lucide-react'
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
  const [cognitoEmail, setCognitoEmail] = useState('')
  const [cognitoPassword, setCognitoPassword] = useState('')

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

  async function handleCognitoConnect(event: React.FormEvent) {
    event.preventDefault()
    setSubmitting(true)
    setError(null)
    try {
      await auth.signInCognito(cognitoEmail.trim(), cognitoPassword)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Cairn sign-in failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-full items-center justify-center bg-background px-4 py-8">
      <div className="w-full max-w-sm space-y-6 rounded-xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-2 text-center">
          <p className="text-3xl font-bold tracking-[0.28em] text-primary uppercase">Asgard</p>
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">Fjall</p>
          <p className="text-sm text-muted-foreground">
            {passkeysConfigured
              ? 'Sign in with your passkey'
              : passkeysConfigured === null
                ? 'Passkey auth offline — connect Cairn below or start apps/auth'
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

        {auth.cognitoConfigured ? (
          <form onSubmit={(e) => void handleCognitoConnect(e)} className="space-y-3 border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Cairn API session (Bearer). Needed for live data after the passkey gate.
            </p>
            <Input
              type="email"
              required
              autoComplete="username"
              placeholder="Email"
              value={cognitoEmail}
              onChange={(e) => setCognitoEmail(e.target.value)}
            />
            <Input
              type="password"
              required
              autoComplete="current-password"
              placeholder="Password"
              value={cognitoPassword}
              onChange={(e) => setCognitoPassword(e.target.value)}
            />
            <Button type="submit" variant="outline" className="w-full" disabled={submitting}>
              {submitting ? 'Connecting…' : 'Connect Cairn'}
            </Button>
          </form>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
    </div>
  )
}

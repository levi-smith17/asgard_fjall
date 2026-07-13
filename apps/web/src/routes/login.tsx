import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { useAuth } from '@/hooks/use-auth'
import { SESSION_COOKIE_NAME, WEBAUTHN_RP_ID } from '@/lib/config'

export function LoginPage() {
  const auth = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (auth.loading) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
        Checking session…
      </div>
    )
  }

  if (auth.user) {
    return <Navigate to="/basecamp" replace />
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError(null)
    setPending(true)
    try {
      await auth.signIn(email.trim(), password)
      navigate('/basecamp', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Sign-in failed')
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-3xl font-bold tracking-[0.28em] text-primary uppercase">Asgard</p>
        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-muted-foreground">Fjall</p>
      </div>

      {auth.configured ? (
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
          <p className="text-center text-xs text-muted-foreground">
            Cairn Cognito session for <code>api.cairn.ing</code>. Passkey gate (
            <code>{SESSION_COOKIE_NAME}</code>, RP <code>{WEBAUTHN_RP_ID}</code>) comes next.
          </p>
          <input
            type="email"
            required
            autoComplete="username"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm"
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {pending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <div className="max-w-md space-y-4 text-center text-sm text-muted-foreground">
          <p>
            Set <code>VITE_COGNITO_USER_POOL_ID</code> and <code>VITE_COGNITO_CLIENT_ID</code> to enable
            Cairn sign-in. Until then you can browse the shell without API data.
          </p>
          <button
            type="button"
            className="rounded-md border border-border px-5 py-2.5 text-sm"
            onClick={() => navigate('/basecamp')}
          >
            Continue without Cognito
          </button>
        </div>
      )}
    </div>
  )
}

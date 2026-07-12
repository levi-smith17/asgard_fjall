import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
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
      <div className="flex min-h-full items-center justify-center text-sm text-[var(--muted-foreground)]">
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
        <p className="text-3xl font-bold tracking-[0.28em] text-[var(--primary)] uppercase">Asgard</p>
        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Fjall</p>
      </div>

      {auth.configured ? (
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-3">
          <p className="text-center text-xs text-[var(--muted-foreground)]">
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
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm"
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-3 py-2 text-sm"
          />
          {error ? <p className="text-xs text-red-400">{error}</p> : null}
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--background)] disabled:opacity-60"
          >
            {pending ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      ) : (
        <div className="max-w-md space-y-4 text-center text-sm text-[var(--muted-foreground)]">
          <p>
            Set <code>VITE_COGNITO_USER_POOL_ID</code> and <code>VITE_COGNITO_CLIENT_ID</code> to enable
            Cairn sign-in. Until then you can browse the shell without API data.
          </p>
          <button
            type="button"
            className="rounded-md border border-[var(--border)] px-5 py-2.5 text-sm"
            onClick={() => navigate('/basecamp')}
          >
            Continue without Cognito
          </button>
        </div>
      )}
    </div>
  )
}

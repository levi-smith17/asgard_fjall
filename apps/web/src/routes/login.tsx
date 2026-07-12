import { SESSION_COOKIE_NAME, WEBAUTHN_RP_ID } from '@/lib/config'

export function LoginPage() {
  return (
    <div className="flex min-h-full flex-col items-center justify-center gap-6 px-6">
      <div className="text-center">
        <p className="text-3xl font-bold tracking-[0.28em] text-[var(--primary)] uppercase">Asgard</p>
        <p className="mt-3 text-sm uppercase tracking-[0.22em] text-[var(--muted-foreground)]">Fjall</p>
      </div>
      <p className="max-w-md text-center text-sm text-[var(--muted-foreground)]">
        Passkey login (single-user). Session cookie <code>{SESSION_COOKIE_NAME}</code>, RP ID{' '}
        <code>{WEBAUTHN_RP_ID}</code>. Wire WebAuthn against a small auth surface or Cairn-hosted
        challenge next — no RealmOps API.
      </p>
      <button
        type="button"
        className="rounded-md bg-[var(--primary)] px-5 py-2.5 text-sm font-semibold text-[var(--background)]"
        disabled
      >
        Continue with passkey (coming soon)
      </button>
    </div>
  )
}

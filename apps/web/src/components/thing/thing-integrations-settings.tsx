import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, KeyRound, Trash2 } from 'lucide-react'
import { Button } from '@/components/core/ui/button'
import { ConfirmDialog } from '@/components/core/ui/confirm-dialog'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { fetchCairnStatus, fetchCairnApiTokenStatus, createCairnApiToken, revokeCairnApiToken } from '@/lib/data-api'

export function ThingIntegrationsSettings() {
  const queryClient = useQueryClient()
  const statusQuery = useQuery({ queryKey: ['cairn-status'], queryFn: fetchCairnStatus, retry: false })
  const tokenQuery = useQuery({ queryKey: ['cairn-api-token'], queryFn: fetchCairnApiTokenStatus, enabled: statusQuery.data?.configured === true })
  const [generatedToken, setGeneratedToken] = useState<string | null>(null)
  const [revokeOpen, setRevokeOpen] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    await queryClient.invalidateQueries({ queryKey: ['cairn-api-token'] })
  }

  async function handleGenerate() {
    setBusy(true)
    setError(null)
    try {
      const result = await createCairnApiToken()
      setGeneratedToken(result.token)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate token')
    } finally {
      setBusy(false)
    }
  }

  async function handleRevoke() {
    setBusy(true)
    setError(null)
    try {
      await revokeCairnApiToken()
      setGeneratedToken(null)
      setRevokeOpen(false)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revoke token')
    } finally {
      setBusy(false)
    }
  }

  async function copyToken() {
    if (!generatedToken) return
    await navigator.clipboard.writeText(generatedToken)
  }

  if (statusQuery.isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>
  if (!statusQuery.data?.configured) return <DataNotConfiguredNotice />

  const status = tokenQuery.data

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-4">
        <div className="flex items-start gap-3">
          <KeyRound className="mt-0.5 h-5 w-5 text-muted-foreground" />
          <div className="space-y-1">
            <p className="text-sm font-medium">Personal API token</p>
            {tokenQuery.isLoading ? (
              <p className="text-sm text-muted-foreground">Checking token status…</p>
            ) : status?.configured ? (
              <p className="text-sm text-muted-foreground">
                Active token prefix <code>{status.tokenPrefix}</code>
                {status.lastUsedAt ? ` · last used ${new Date(status.lastUsedAt).toLocaleString()}` : ''}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">No active token.</p>
            )}
          </div>
        </div>

        {generatedToken ? (
          <div className="space-y-2 rounded-md border border-amber-500/40 bg-amber-500/10 p-3">
            <p className="text-sm font-medium text-foreground">Copy this token now</p>
            <p className="text-xs text-muted-foreground">
              This is the only time the full token is shown. Store it in the destination that needs direct API access.
            </p>
            <div className="flex items-center gap-2">
              <code className="min-w-0 flex-1 break-all rounded bg-background px-2 py-1 text-xs">{generatedToken}</code>
              <Button type="button" size="sm" variant="outline" onClick={() => void copyToken()}>
                <Copy className="h-4 w-4" />
                Copy
              </Button>
            </div>
          </div>
        ) : null}

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => void handleGenerate()} disabled={busy}>
            {status?.configured ? 'Rotate token' : 'Generate token'}
          </Button>
          {status?.configured ? (
            <Button type="button" variant="outline" disabled={busy} onClick={() => setRevokeOpen(true)}>
              <Trash2 className="h-4 w-4" />
              Revoke
            </Button>
          ) : null}
        </div>
      </div>

      <ConfirmDialog
        open={revokeOpen}
        title="Revoke API token?"
        description="Apps using this token will lose access until you generate a new one."
        confirmLabel="Revoke token"
        confirmVariant="destructive"
        onConfirm={() => void handleRevoke()}
        onCancel={() => setRevokeOpen(false)}
      />
    </div>
  )
}

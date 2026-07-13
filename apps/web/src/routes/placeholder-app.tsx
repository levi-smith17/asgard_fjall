import { useTerminology } from '@/hooks/use-terminology'
import { CAIRN_API_URL } from '@/lib/config'

export function PlaceholderAppPage({
  nameKey,
}: {
  nameKey: 'provisions' | 'calendar' | 'resume' | 'notes' | 'starfield' | 'messages'
}) {
  const { terms } = useTerminology()
  const name = terms[nameKey]

  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 sm:px-10">
      <h1 className="text-2xl font-semibold tracking-wide">{name}</h1>
      <p className="mt-2 max-w-xl text-sm text-muted-foreground">
        Port from private Asgard Cairn surfaces. Browser → <code>{CAIRN_API_URL}</code> via{' '}
        <code>cairnFetch</code> once CORS + Cognito (or BFF) are configured.
      </p>
    </div>
  )
}

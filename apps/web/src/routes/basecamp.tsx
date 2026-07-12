import { useQuery } from '@tanstack/react-query'
import { ChevronRight, NotebookPen, ScrollText, Stars } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology } from '@/hooks/use-terminology'
import { cairnFetch, fetchCairnHealth } from '@/lib/cairn-client'
import { CAIRN_API_URL } from '@/lib/config'
import { cn } from '@/lib/utils'

type Trail = { id: string; name: string }
type Log = {
  id: string
  title?: string | null
  content?: string
  trailId?: string | null
  updatedAt?: string
  createdAt?: string
}
type ManifestSummary = {
  expeditions?: unknown[]
  training?: unknown[]
  gear?: unknown[]
  landmarks?: unknown[]
  summits?: unknown[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function SnapshotCard({
  to,
  label,
  children,
}: {
  to: string
  label: string
  children: React.ReactNode
}) {
  return (
    <Link
      to={to}
      className="group flex h-32 flex-col rounded-xl border border-[var(--border)] bg-[var(--muted)]/40 p-3 transition-colors hover:border-[var(--primary)]/40"
    >
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--muted-foreground)]">
        {label}
        <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-2 min-h-0 flex-1 text-sm">{children}</div>
    </Link>
  )
}

function CardRow({
  title,
  to,
  icon: Icon,
  items,
  empty,
}: {
  title: string
  to: string
  icon: typeof NotebookPen
  items: Array<{ id: string; title: string; subtitle: string }>
  empty: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </h2>
        <Link to={to} className="text-xs text-[var(--primary)] hover:underline">
          Open
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted-foreground)]">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={to}
              className={cn(
                'rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 px-4 py-4 transition-colors',
                'hover:border-[var(--primary)]/40',
              )}
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-[var(--muted-foreground)]">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

export function BasecampPage() {
  const { terms } = useTerminology()
  const auth = useAuth()

  const health = useQuery({
    queryKey: ['cairn-health'],
    queryFn: fetchCairnHealth,
    retry: false,
    refetchInterval: 60_000,
  })

  const enabled = Boolean(auth.user)

  const trailsQuery = useQuery({
    queryKey: ['cairn-trails'],
    queryFn: () => cairnFetch<Trail[]>('/trails'),
    enabled,
    retry: false,
  })

  const logsQuery = useQuery({
    queryKey: ['cairn-logs'],
    queryFn: () => cairnFetch<Log[]>('/logs'),
    enabled,
    retry: false,
  })

  const manifestQuery = useQuery({
    queryKey: ['cairn-manifest'],
    queryFn: () => cairnFetch<ManifestSummary>('/manifest'),
    enabled,
    retry: false,
  })

  const snapshots = [
    { name: terms.resume, to: '/ordstirr', body: auth.user ? 'Manifest' : 'Sign in for live data' },
    { name: terms.provisions, to: '/audr', body: 'Audr snapshot' },
    { name: terms.calendar, to: '/dagatal', body: 'Itinerary' },
    { name: terms.messages, to: '/sendibod', body: 'Signals' },
  ] as const

  const trails = trailsQuery.data ?? []
  const logs = logsQuery.data ?? []
  const logbooks = (() => {
    const byTrail = new Map<string, { id: string; title: string; subtitle: string; stamp: string }>()
    for (const log of logs) {
      const key = log.trailId ?? '__unfiled__'
      const stamp = String(log.updatedAt ?? log.createdAt ?? '')
      const existing = byTrail.get(key)
      if (existing && stamp <= existing.stamp) continue
      const trail = log.trailId ? trails.find((t) => t.id === log.trailId) : null
      const plain = stripHtml(log.content ?? '')
      byTrail.set(key, {
        id: key,
        title: trail?.name ?? 'Unfiled',
        subtitle:
          (log.title ? `${log.title} — ` : '') +
          (plain.length > 100 ? `${plain.slice(0, 100)}…` : plain || 'No excerpt'),
        stamp,
      })
    }
    return [...byTrail.values()].slice(0, 6)
  })()

  const manifest = manifestQuery.data
  const manifestCards = manifest
    ? [
        { id: 'expeditions', title: 'Expeditions', subtitle: `${manifest.expeditions?.length ?? 0} entries` },
        { id: 'training', title: 'Training', subtitle: `${manifest.training?.length ?? 0} entries` },
        { id: 'gear', title: 'Gear', subtitle: `${manifest.gear?.length ?? 0} entries` },
        { id: 'landmarks', title: 'Landmarks', subtitle: `${manifest.landmarks?.length ?? 0} entries` },
        { id: 'summits', title: 'Summits', subtitle: `${manifest.summits?.length ?? 0} entries` },
      ]
    : []

  const apiError =
    trailsQuery.error || logsQuery.error || manifestQuery.error
      ? 'Cairn fetch failed — check CORS + Cognito client for asgard.levismith.us'
      : null

  return (
    <div className="space-y-10 px-6 py-8 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">{terms.basecamp}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Snapshots + Summit-style rows + Stjornur. Data from <code>{CAIRN_API_URL}</code>.
          </p>
        </div>
        <div className="text-right text-xs text-[var(--muted-foreground)]">
          <p>
            API:{' '}
            {health.isLoading
              ? 'checking…'
              : health.data?.ok
                ? `reachable (${health.data.status})`
                : `unreachable (${health.data?.status ?? 'network'})`}
          </p>
          <p className="mt-1">
            Auth: {auth.configured ? (auth.user ? auth.user.email : 'signed out') : 'Cognito not configured'}
          </p>
          {apiError ? <p className="mt-1 text-red-400">{apiError}</p> : null}
        </div>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Snapshots
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshots.map((item) => (
            <SnapshotCard key={item.to} to={item.to} label={item.name}>
              <p className="text-[var(--muted-foreground)]">{item.body}</p>
            </SnapshotCard>
          ))}
        </div>
      </section>

      <CardRow
        title={terms.notes}
        to="/sogur"
        icon={NotebookPen}
        items={logbooks}
        empty={
          enabled
            ? 'No logbooks yet (or trails/logs not loaded).'
            : 'Sign in with Cognito to load Sogur cards.'
        }
      />

      <CardRow
        title={terms.resume}
        to="/ordstirr"
        icon={ScrollText}
        items={manifestCards}
        empty={
          enabled
            ? 'Manifest sections unavailable.'
            : 'Sign in with Cognito to load Ordstirr cards.'
        }
      />

      <CardRow
        title={terms.starfield}
        to="/stjornur"
        icon={Stars}
        items={[]}
        empty="Stjornur row next — wire /starfield networks after CORS is open."
      />
    </div>
  )
}

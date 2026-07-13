import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CalendarDays,
  ChevronRight,
  CreditCard,
  Mail,
  NotebookPen,
  Rocket,
  ScrollText,
  Wallet,
} from 'lucide-react'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { useAuth } from '@/hooks/use-auth'
import { useTerminology, useTerms } from '@/hooks/use-terminology'
import {
  fetchCairnItineraryEvents,
  fetchCairnLogs,
  fetchCairnProvisionsSummary,
  fetchCairnSignals,
  fetchCairnStarfieldNetworks,
  fetchCairnStatus,
  fetchCairnTrails,
} from '@/lib/cairn-api'
import { extractCairnId } from '@/lib/cairn-format'
import { fetchManifest } from '@/lib/manifest-api'
import { getManifestTerms, termsFor } from '@/lib/terminology'
import { cn } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function SnapshotSkeleton() {
  return (
    <div className="h-[8rem] animate-pulse rounded-xl border border-border bg-card p-4">
      <div className="mb-2 h-3 w-16 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="mt-3 h-3 w-full rounded bg-muted" />
    </div>
  )
}

function PanelShell({
  href,
  label,
  icon: Icon,
  children,
}: {
  href: string
  label: string
  icon: typeof Wallet
  children: React.ReactNode
}) {
  return (
    <Link
      to={href}
      className="group flex h-[8rem] flex-col rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
    >
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="h-3 w-3" aria-hidden />
        {label}
        <ChevronRight className="ml-auto h-3 w-3 opacity-0 transition-opacity group-hover:opacity-100" />
      </div>
      <div className="mt-2 min-h-0 flex-1 overflow-hidden">{children}</div>
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
  items: Array<{ id: string; title: string; subtitle: string; href?: string }>
  empty: string
}) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <Icon className="h-3.5 w-3.5" aria-hidden />
          {title}
        </h2>
        <Link to={to} className="text-xs text-primary hover:underline">
          Open
        </Link>
      </div>
      {items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          {empty}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              to={item.href ?? to}
              className={cn(
                'rounded-lg border border-border bg-muted/30 px-4 py-4 transition-colors',
                'hover:border-primary/40',
              )}
            >
              <p className="text-sm font-medium">{item.title}</p>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{item.subtitle}</p>
            </Link>
          ))}
        </div>
      )}
    </section>
  )
}

function HlidskjalfContextBar() {
  const { terms, style } = useTerminology()
  const subtitle = style === 'STANDARD' ? undefined : termsFor('STANDARD').dashboard

  return (
    <StudioContextBar
      aria-label={`${terms.dashboard} context`}
      title={terms.dashboard}
      subtitle={subtitle}
      actions={<GlobalSearchTrigger />}
    />
  )
}

function HlidskjalfSnapshots() {
  const terms = useTerms()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  const provisionsQuery = useQuery({
    queryKey: ['cairn-snapshot-provisions', month, year],
    queryFn: () => fetchCairnProvisionsSummary(month, year),
    enabled: configured,
    staleTime: 60_000,
  })

  const itineraryQuery = useQuery({
    queryKey: ['cairn-snapshot-itinerary'],
    queryFn: () => fetchCairnItineraryEvents(),
    enabled: configured,
    staleTime: 60_000,
  })

  const signalsQuery = useQuery({
    queryKey: ['cairn-snapshot-signals'],
    queryFn: fetchCairnSignals,
    enabled: configured,
    staleTime: 60_000,
  })

  const manifestQuery = useQuery({
    queryKey: ['cairn-snapshot-manifest'],
    queryFn: fetchManifest,
    enabled: configured,
    staleTime: 60_000,
  })

  const isLoading = statusQuery.isLoading
  const summary = provisionsQuery.data?.summary
  const upcomingRenewals = provisionsQuery.data?.upcomingRenewals ?? []
  const cacheUtilization = provisionsQuery.data?.cacheUtilization ?? []
  const cacheTotalLimit = cacheUtilization.reduce((sum, item) => sum + item.limit, 0)
  const cacheTotalSpent = cacheUtilization.reduce((sum, item) => sum + item.spent, 0)

  const upcomingEvents = (itineraryQuery.data?.events ?? [])
    .filter((event) => event.startDate >= new Date())
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3)

  const signals = signalsQuery.data ?? []
  const unreadCount = signals.filter((signal) => !signal.read).length
  const latestMessages = [...signals]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 2)

  const manifest = manifestQuery.data
  const manifestSectionRows = useMemo(() => {
    if (!manifest) return []
    const mTerms = getManifestTerms('CAIRN')
    return [
      [mTerms.expeditions, manifest.expeditions.length],
      [mTerms.training, manifest.training.length],
      [mTerms.gear, manifest.gear.length],
      [mTerms.landmarks, manifest.landmarks.length],
      [mTerms.summits, manifest.summits.length],
      [mTerms.pathfinding, manifest.pathfinding.length],
      [mTerms.companions, manifest.companions.length],
    ] as [string, number][]
  }, [manifest])
  const manifestHasContent = manifestSectionRows.some(([, count]) => count > 0)

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Snapshot
        </h2>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, index) => <SnapshotSkeleton key={index} />)
        ) : !configured ? (
          [terms.resume, terms.provisions, terms.calendar, terms.messages].map((label) => (
            <div
              key={label}
              className="flex h-[8rem] flex-col rounded-xl border border-border bg-card p-3"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                {label}
              </span>
              <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                Connect Cairn to load snapshots
              </p>
            </div>
          ))
        ) : (
          <>
            <PanelShell href="/ordstirr" label={terms.resume} icon={ScrollText}>
              {manifestQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ) : !manifestHasContent ? (
                <p className="text-xs text-muted-foreground">Manifest not started</p>
              ) : (
                <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                  {manifestSectionRows.map(([label, count]) => (
                    <div key={label} className="flex min-w-0 items-center justify-between gap-1">
                      <span className="truncate text-muted-foreground">{label}</span>
                      <span className="shrink-0 font-medium tabular-nums">{count}</span>
                    </div>
                  ))}
                </div>
              )}
            </PanelShell>

            <PanelShell href="/audr" label={terms.provisions} icon={Wallet}>
              {provisionsQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ) : (
                <div className="space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <CreditCard className="h-3 w-3" />
                      {terms.subscriptions}
                    </span>
                    <span className="truncate font-medium tabular-nums">
                      {fmt(summary?.monthlySupplylineCost ?? 0)}
                      <span className="font-normal text-muted-foreground">
                        {' '}
                        · {summary?.activeSupplylines ?? 0} active
                      </span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-muted-foreground">{terms.expenses}</span>
                    <span className="font-medium tabular-nums">{fmt(summary?.totalBurn ?? 0)}</span>
                  </div>
                  {cacheTotalLimit > 0 ? (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground">{terms.budgets}</span>
                      <span className="truncate font-medium tabular-nums">
                        {fmt(cacheTotalSpent)}
                        <span className="font-normal text-muted-foreground">
                          {' '}
                          / {fmt(cacheTotalLimit)}
                        </span>
                      </span>
                    </div>
                  ) : null}
                  {upcomingRenewals.length > 0 ? (
                    <p className="text-amber-600 dark:text-amber-400">
                      {upcomingRenewals.length} renewal
                      {upcomingRenewals.length !== 1 ? 's' : ''} soon
                    </p>
                  ) : null}
                </div>
              )}
            </PanelShell>

            <PanelShell href="/dagatal" label={terms.calendar} icon={CalendarDays}>
              {itineraryQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                </div>
              ) : upcomingEvents.length === 0 ? (
                <p className="text-xs text-muted-foreground">No upcoming events</p>
              ) : (
                <ul className="space-y-1">
                  {upcomingEvents.map((event) => (
                    <li key={event.uid} className="flex items-start gap-1.5 text-xs">
                      <span
                        className="mt-1 h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                      <span className="min-w-0 truncate">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-muted-foreground">
                          {' '}
                          ·{' '}
                          {event.startDate.toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelShell>

            <PanelShell href="/sendibod" label={terms.messages} icon={Mail}>
              {signalsQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-4/5 animate-pulse rounded bg-muted" />
                </div>
              ) : latestMessages.length === 0 ? (
                <p className="text-xs text-muted-foreground">No messages yet</p>
              ) : (
                <div className="space-y-1.5">
                  {unreadCount > 0 ? (
                    <p className="text-xs font-medium text-primary">{unreadCount} unread</p>
                  ) : null}
                  {latestMessages.map((message) => (
                    <p
                      key={message.id}
                      className={cn(
                        'truncate text-xs',
                        message.read ? 'text-muted-foreground' : 'font-medium',
                      )}
                    >
                      {message.senderName}: {message.body}
                    </p>
                  ))}
                </div>
              )}
            </PanelShell>
          </>
        )}
      </div>
    </section>
  )
}

function HlidskjalfCanvas() {
  const terms = useTerms()
  const auth = useAuth()
  const enabled = Boolean(auth.user)

  const trailsQuery = useQuery({
    queryKey: ['cairn-trails'],
    queryFn: fetchCairnTrails,
    enabled,
    retry: false,
  })

  const logsQuery = useQuery({
    queryKey: ['cairn-logs-hlidskjalf'],
    queryFn: fetchCairnLogs,
    enabled,
    retry: false,
  })

  const manifestQuery = useQuery({
    queryKey: ['cairn-manifest'],
    queryFn: fetchManifest,
    enabled,
    retry: false,
  })

  const networksQuery = useQuery({
    queryKey: ['cairn-starfield-networks'],
    queryFn: fetchCairnStarfieldNetworks,
    enabled,
    retry: false,
  })

  const trails = trailsQuery.data ?? []
  const trailsById = new Map(trails.map((trail) => [extractCairnId(trail.sk), trail.name]))
  const logs = logsQuery.data ?? []

  const logbooks = (() => {
    const byTrail = new Map<string, { id: string; title: string; subtitle: string; stamp: string }>()
    for (const log of logs) {
      const key = log.trailId ?? '__unfiled__'
      const stamp = String(log.createdAt ?? '')
      const existing = byTrail.get(key)
      if (existing && stamp <= existing.stamp) continue
      const plain = stripHtml(log.content ?? '')
      byTrail.set(key, {
        id: key,
        title: log.trailName ?? (log.trailId ? trailsById.get(log.trailId) : null) ?? 'Unfiled',
        subtitle:
          (log.title ? `${log.title} — ` : '') +
          (plain.length > 100 ? `${plain.slice(0, 100)}…` : plain || 'No excerpt'),
        stamp,
      })
    }
    return [...byTrail.values()].slice(0, 6)
  })()

  const manifest = manifestQuery.data
  const mTerms = getManifestTerms('CAIRN')
  const manifestCards = manifest
    ? [
        { id: 'expeditions', title: mTerms.expeditions, subtitle: `${manifest.expeditions.length} entries` },
        { id: 'training', title: mTerms.training, subtitle: `${manifest.training.length} entries` },
        { id: 'gear', title: mTerms.gear, subtitle: `${manifest.gear.length} entries` },
        { id: 'landmarks', title: mTerms.landmarks, subtitle: `${manifest.landmarks.length} entries` },
        { id: 'summits', title: mTerms.summits, subtitle: `${manifest.summits.length} entries` },
        { id: 'pathfinding', title: mTerms.pathfinding, subtitle: `${manifest.pathfinding.length} entries` },
      ]
    : []

  const networks = (networksQuery.data ?? []).map((network) => ({
    id: network.id,
    title: network.name,
    subtitle: network.description?.trim() || 'Starfield network',
    href: `/stjornur?network=${encodeURIComponent(network.id)}`,
  }))

  return (
    <div className="min-h-0 flex-1 space-y-10 overflow-y-auto px-6 py-8 sm:px-10">
      <HlidskjalfSnapshots />

      <CardRow
        title={terms.notes}
        to="/sogur"
        icon={NotebookPen}
        items={logbooks}
        empty={
          enabled
            ? 'No logbooks yet.'
            : 'Sign in with Cognito to load logbook cards.'
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
            : 'Sign in with Cognito to load manifest cards.'
        }
      />

      <CardRow
        title={terms.starfield}
        to="/stjornur"
        icon={Rocket}
        items={networks}
        empty={
          networksQuery.isLoading
            ? 'Loading networks…'
            : networksQuery.isError
              ? 'Could not load starfield networks.'
              : enabled
                ? 'No starfield networks yet.'
                : 'Sign in with Cognito to load starfield networks.'
        }
      />
    </div>
  )
}

export function HlidskjalfPage() {
  return (
    <StudioLayout
      contextBar={<HlidskjalfContextBar />}
      canvas={<HlidskjalfCanvas />}
    />
  )
}

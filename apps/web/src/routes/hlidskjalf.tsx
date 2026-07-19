import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  Award,
  Backpack,
  Briefcase,
  CalendarDays,
  ChevronRight,
  Compass,
  CreditCard,
  Flag,
  GraduationCap,
  Mail,
  NotebookPen,
  PawPrint,
  Rocket,
  ScrollText,
  Wallet,
} from 'lucide-react'
import {
  FjallCatalogInspector,
  type FjallCatalogTab,
} from '@/components/apps/catalog-inspector'
import { dataQueryErrorProps } from '@/components/apps/data-not-configured'
import { LaufInspector } from '@/components/apps/lauf-inspector'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { HlidskjalfContextBar } from '@/components/hlidskjalf/hlidskjalf-context-bar'
import {
  HlidskjalfLaufarRail,
  LAUFAR_FILTER_ALL,
  LAUFAR_UNASSIGNED_GREIN,
} from '@/components/hlidskjalf/hlidskjalf-laufar-rail'
import { useAuth } from '@/hooks/use-auth'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { useTerminology, useTerms } from '@/hooks/use-terminology'
import { fetchDagatalEvents } from '@/lib/dagatal-api'
import {
  createFjallLauf,
  deleteFjallLauf,
  fetchFjallLogs,
  fetchFjallRunir,
  fetchProvisionsSummary,
  fetchFjallSignals,
  fetchFjallStarfieldNetworks,
  fetchFjallStatus,
  fetchFjallGreinar,
  fetchFjallLaufar,
  updateFjallLauf,
} from '@/lib/data-api'
import { extractEntityId, toRunView, toGreinView, toLaufView } from '@/lib/data-format'
import { isUnderAudrRunRoot } from '@/lib/audr-run-root'
import { isGreinVisibleOnPage } from '@/lib/grein-visibility'
import { buildManifestSectionCards } from '@/lib/hlidskjalf-manifest-cards'
import { fetchManifest } from '@/lib/manifest-api'
import { getManifestTerms } from '@/lib/terminology'
import { cn, includesFoldedSearch } from '@/lib/utils'

const fmt = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)

const MANIFEST_ICONS = {
  expeditions: Briefcase,
  training: GraduationCap,
  gear: Backpack,
  landmarks: Flag,
  summits: Award,
  pathfinding: Compass,
  companions: PawPrint,
} as const

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function parseRunPath(value: string | null): string[] {
  if (!value?.trim()) return []
  return value.split('/').filter(Boolean)
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

function SectionViewAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-0.5 text-[10px] text-muted-foreground transition-colors hover:text-foreground"
    >
      View all
      <ChevronRight className="h-3 w-3" />
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
        <SectionViewAllLink to={to} />
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

function HlidskjalfSnapshots() {
  const terms = useTerms()
  const { style } = useTerminology()
  const now = new Date()
  const month = now.getMonth() + 1
  const year = now.getFullYear()

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  const provisionsQuery = useQuery({
    queryKey: ['fjall-snapshot-provisions', month, year],
    queryFn: () => fetchProvisionsSummary(month, year),
    enabled: configured,
    staleTime: 60_000,
  })

  const dagatalQuery = useQuery({
    queryKey: ['dagatal-events'],
    queryFn: () => fetchDagatalEvents(),
    enabled: configured,
    retry: false,
    staleTime: 60_000,
  })

  const signalsQuery = useQuery({
    queryKey: ['fjall-snapshot-signals'],
    queryFn: fetchFjallSignals,
    enabled: configured,
    staleTime: 60_000,
  })

  const manifestQuery = useQuery({
    queryKey: ['fjall-snapshot-manifest'],
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

  const upcomingEvents = (dagatalQuery.data?.events ?? [])
    .filter((event) => {
      const end = event.endDate ?? event.startDate
      return end >= new Date()
    })
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
    const mTerms = getManifestTerms(style)
    return [
      [mTerms.expeditions, manifest.expeditions.length],
      [mTerms.training, manifest.training.length],
      [mTerms.gear, manifest.gear.length],
      [mTerms.landmarks, manifest.landmarks.length],
      [mTerms.summits, manifest.summits.length],
      [mTerms.pathfinding, manifest.pathfinding.length],
      [mTerms.companions, manifest.companions.length],
    ] as [string, number][]
  }, [manifest, style])
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
                Connect data to load snapshots
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
              {dagatalQuery.isLoading ? (
                <div className="space-y-1.5">
                  <div className="h-3 w-full animate-pulse rounded bg-muted" />
                  <div className="h-3 w-3/5 animate-pulse rounded bg-muted" />
                </div>
              ) : dagatalQuery.isError ? (
                <p className="text-xs text-muted-foreground">Couldn’t load calendar</p>
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

function OrdstirrSection({
  enabled,
  isLoading,
  isError,
  cards,
}: {
  enabled: boolean
  isLoading: boolean
  isError: boolean
  cards: ReturnType<typeof buildManifestSectionCards>
}) {
  const terms = useTerms()
  const { style } = useTerminology()
  const mTerms = getManifestTerms(style)

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          <ScrollText className="h-3.5 w-3.5" aria-hidden />
          {terms.resume}
        </h2>
        <SectionViewAllLink to="/ordstirr" />
      </div>
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-24 animate-pulse rounded-xl border border-border bg-muted/30" />
          ))}
        </div>
      ) : isError || cards.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">
          {enabled
            ? isError
              ? 'Could not load Ordstirr sections.'
              : 'Ordstirr sections unavailable.'
            : 'Sign in with your passkey to load manifest cards.'}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {cards.map((section) => {
            const Icon = MANIFEST_ICONS[section.id]
            const label = mTerms[section.termKey]
            return (
              <Link
                key={section.id}
                to={`/ordstirr?section=${section.id}`}
                className="group flex flex-col rounded-xl border border-border bg-card p-3 transition-colors hover:border-primary/40 hover:bg-muted/30"
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <Icon className="h-3 w-3" aria-hidden />
                  <span className="truncate">{label}</span>
                  <span className="ml-auto tabular-nums">{section.count}</span>
                </div>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {section.summary ?? `No ${label.toLowerCase()} yet`}
                </p>
              </Link>
            )
          })}
        </div>
      )}
    </section>
  )
}

function HlidskjalfCanvas() {
  const terms = useTerms()
  const auth = useAuth()
  const enabled = Boolean(auth.dataUser)

  const logsQuery = useQuery({
    queryKey: ['fjall-logs-hlidskjalf'],
    queryFn: fetchFjallLogs,
    enabled,
    retry: false,
  })

  const greinarQuery = useQuery({
    queryKey: ['fjall-greinar'],
    queryFn: fetchFjallGreinar,
    enabled,
    retry: false,
  })

  const manifestQuery = useQuery({
    queryKey: ['fjall-manifest'],
    queryFn: fetchManifest,
    enabled,
    retry: false,
  })

  const networksQuery = useQuery({
    queryKey: ['fjall-starfield-networks'],
    queryFn: fetchFjallStarfieldNetworks,
    enabled,
    retry: false,
  })

  const greinar = greinarQuery.data ?? []
  const greinarById = new Map(greinar.map((grein) => [extractEntityId(grein.sk), grein.name]))
  const logs = logsQuery.data ?? []

  const logbooks = (() => {
    const byGrein = new Map<string, { id: string; title: string; subtitle: string; stamp: string }>()
    for (const log of logs) {
      const key = log.greinId ?? '__unfiled__'
      const stamp = String(log.createdAt ?? '')
      const existing = byGrein.get(key)
      if (existing && stamp <= existing.stamp) continue
      const plain = stripHtml(log.content ?? '')
      byGrein.set(key, {
        id: key,
        title: log.greinName ?? (log.greinId ? greinarById.get(log.greinId) : null) ?? 'Unfiled',
        subtitle:
          (log.title ? `${log.title} — ` : '') +
          (plain.length > 100 ? `${plain.slice(0, 100)}…` : plain || 'No excerpt'),
        stamp,
      })
    }
    return [...byGrein.values()].slice(0, 6)
  })()

  const manifestCards = useMemo(
    () => (manifestQuery.data ? buildManifestSectionCards(manifestQuery.data) : []),
    [manifestQuery.data],
  )

  const networks = (networksQuery.data ?? []).map((network) => ({
    id: network.id,
    title: network.name,
    subtitle: network.description?.trim() || 'Stjörnur network',
    href: `/stjornur?network=${encodeURIComponent(network.id)}`,
  }))

  return (
    <div
      className="min-h-0 flex-1 space-y-10 overflow-y-auto px-6 py-8 sm:px-10"
      data-inspectable-canvas
    >
      <HlidskjalfSnapshots />

      <CardRow
        title={terms.notes}
        to="/sogur"
        icon={NotebookPen}
        items={logbooks}
        empty={enabled ? 'No logbooks yet.' : 'Sign in with your passkey to load logbook cards.'}
      />

      <OrdstirrSection
        enabled={enabled}
        isLoading={manifestQuery.isLoading}
        isError={manifestQuery.isError}
        cards={manifestCards}
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
                : 'Sign in with your passkey to load starfield networks.'
        }
      />
    </div>
  )
}

export function HlidskjalfPage() {
  const terms = useTerms()
  const [searchParams, setSearchParams] = useSearchParams()
  const queryClient = useQueryClient()
  const [laufarFilter, setLaufarFilter] = useState('')
  const [greinFilterId, setGreinFilterId] = useState(LAUFAR_FILTER_ALL)
  const [runirFilterId, setRunirFilterId] = useState(LAUFAR_FILTER_ALL)
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()

  const laufarId = searchParams.get('laufar')
  const catalogTab = (searchParams.get('catalog') as FjallCatalogTab | null) ?? null
  const catalogId = searchParams.get('catalogId')
  const runPath = parseRunPath(searchParams.get('runPath'))
  const runParent = searchParams.get('runParent')

  const laufarQuery = useQuery({
    queryKey: ['fjall-laufar'],
    queryFn: fetchFjallLaufar,
    retry: false,
  })
  const greinarQuery = useQuery({
    queryKey: ['fjall-greinar'],
    queryFn: fetchFjallGreinar,
    retry: false,
  })
  const runirQuery = useQuery({
    queryKey: ['fjall-runir'],
    queryFn: fetchFjallRunir,
    retry: false,
  })

  const dataErrorProps = useMemo(() => {
    const error = laufarQuery.error ?? greinarQuery.error ?? runirQuery.error
    return dataQueryErrorProps(error, 'Data request failed')
  }, [runirQuery.error, greinarQuery.error, laufarQuery.error])

  const greinar = useMemo(
    () => (greinarQuery.data ?? []).map(toGreinView).sort((a, b) => a.name.localeCompare(b.name)),
    [greinarQuery.data],
  )
  const greinarById = useMemo(() => new Map(greinar.map((grein) => [grein.id, grein])), [greinar])
  /** Greinar hidden from Hlidskjalf via the per-Grein Page Visibility setting. */
  const hiddenGreinIds = useMemo(
    () =>
      new Set(
        greinar.filter((grein) => !isGreinVisibleOnPage(grein, 'hlidskjalf')).map((grein) => grein.id),
      ),
    [greinar],
  )
  /** Greinar available on Hlidskjalf — those hidden here are managed on their other pages. */
  const hlidskjalfGreinar = useMemo(
    () => greinar.filter((grein) => isGreinVisibleOnPage(grein, 'hlidskjalf')),
    [greinar],
  )
  const runir = useMemo(
    () => (runirQuery.data ?? []).map(toRunView).sort((a, b) => a.name.localeCompare(b.name)),
    [runirQuery.data],
  )
  const hlidskjalfRunir = useMemo(
    () => runir.filter((run) => !isUnderAudrRunRoot(run.name)),
    [runir],
  )

  const laufar = useMemo(() => {
    let all = (laufarQuery.data ?? []).map((lauf) => toLaufView(lauf, greinarById))

    all = all.filter((lauf) => !lauf.greinId || !hiddenGreinIds.has(lauf.greinId))

    if (greinFilterId === LAUFAR_UNASSIGNED_GREIN) {
      all = all.filter((lauf) => !lauf.greinId)
    } else if (greinFilterId !== LAUFAR_FILTER_ALL) {
      all = all.filter((lauf) => lauf.greinId === greinFilterId)
    }

    if (runirFilterId !== LAUFAR_FILTER_ALL) {
      all = all.filter((lauf) => lauf.runir.some((run) => run.id === runirFilterId))
    }

    if (!laufarFilter.trim()) return all
    return all.filter((lauf) => {
      const haystack = [
        lauf.title,
        lauf.url,
        lauf.notes,
        lauf.greinName ?? '',
        ...lauf.runir.map((run) => run.name),
      ].join(' ')
      return includesFoldedSearch(haystack, laufarFilter)
    })
  }, [
    greinFilterId,
    laufarFilter,
    hiddenGreinIds,
    runirFilterId,
    greinarById,
    laufarQuery.data,
  ])

  const laufarGroups = useMemo(() => {
    const byGrein = new Map<string, typeof laufar>()
    for (const lauf of laufar) {
      const label = lauf.greinName ?? terms.unassigned
      const bucket = byGrein.get(label) ?? []
      bucket.push(lauf)
      byGrein.set(label, bucket)
    }
    return [...byGrein.entries()]
      .sort(([left], [right]) => {
        if (left === terms.unassigned) return 1
        if (right === terms.unassigned) return -1
        return left.localeCompare(right)
      })
      .map(([label, items]) => ({
        label,
        laufar: items.sort((a, b) => a.title.localeCompare(b.title)),
      }))
  }, [terms.unassigned, laufar])

  const selectedLauf =
    laufarId && laufarId !== 'new'
      ? (laufar.find((lauf) => lauf.id === laufarId) ?? null)
      : null
  const isNewLaufar = laufarId === 'new'

  const patchParams = useCallback(
    (mutator: (params: URLSearchParams) => void, replace = false) => {
      const params = new URLSearchParams(searchParams)
      mutator(params)
      setSearchParams(params, { replace })
    },
    [searchParams, setSearchParams],
  )

  const clearCatalogSelection = useCallback(() => {
    patchParams((params) => {
      params.delete('laufar')
      params.delete('catalog')
      params.delete('catalogId')
      params.delete('runPath')
      params.delete('runParent')
    })
  }, [patchParams])

  const selectLaufar = useCallback(
    (id: string) => {
      patchParams((params) => {
        params.set('laufar', id)
        params.delete('catalog')
        params.delete('catalogId')
        params.delete('runPath')
        params.delete('runParent')
      })
    },
    [patchParams],
  )

  const openCatalog = useCallback(
    (tab: FjallCatalogTab = 'greinar') => {
      patchParams((params) => {
        params.set('catalog', tab)
        params.delete('laufar')
        params.delete('catalogId')
        params.delete('runPath')
        params.delete('runParent')
      })
    },
    [patchParams],
  )

  const startAddCatalogEntity = useCallback(
    (tab: FjallCatalogTab) => {
      patchParams((params) => {
        params.set('catalog', tab)
        params.set('catalogId', 'new')
        params.delete('laufar')
        params.delete('runPath')
        params.delete('runParent')
      })
    },
    [patchParams],
  )

  const dismissInspector = useCallback(() => {
    if (inspectorPinned) return
    clearCatalogSelection()
  }, [clearCatalogSelection, inspectorPinned])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  useEffect(() => {
    if (
      greinFilterId !== LAUFAR_FILTER_ALL &&
      greinFilterId !== LAUFAR_UNASSIGNED_GREIN &&
      hiddenGreinIds.has(greinFilterId)
    ) {
      setGreinFilterId(LAUFAR_FILTER_ALL)
    }
  }, [greinFilterId, hiddenGreinIds])

  const saveLaufMutation = useMutation({
    mutationFn: async (values: {
      title: string
      url: string
      notes: string
      greinId: string
      runIds: string[]
    }) => {
      const payload = {
        title: values.title,
        url: values.url,
        notes: values.notes,
        greinId: values.greinId || null,
        runIds: values.runIds,
      }
      if (isNewLaufar) return createFjallLauf(payload)
      return updateFjallLauf(laufarId!, payload)
    },
    onSuccess: () => {
      toast.success(isNewLaufar ? `${terms.laufarSingular} created` : `${terms.laufarSingular} saved`)
      void queryClient.invalidateQueries({ queryKey: ['fjall-laufar'] })
      if (isNewLaufar) clearCatalogSelection()
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to save ${terms.laufarSingular.toLowerCase()}`,
      ),
  })

  const deleteLaufMutation = useMutation({
    mutationFn: () => deleteFjallLauf(laufarId!),
    onSuccess: () => {
      toast.success(`${terms.laufarSingular} deleted`)
      void queryClient.invalidateQueries({ queryKey: ['fjall-laufar'] })
      clearCatalogSelection()
    },
    onError: (error) =>
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to delete ${terms.laufarSingular.toLowerCase()}`,
      ),
  })

  const catalogInspectorOpen = laufarId != null || catalogTab != null
  const inspectorOpen = inspectorPinned || catalogInspectorOpen
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  const laufarUnavailable =
    (laufarQuery.isError || greinarQuery.isError || runirQuery.isError) &&
    !laufarQuery.isLoading
      ? dataErrorProps.isConfigError || dataErrorProps.isTokenError
        ? (dataErrorProps.detail ?? 'Data API is not configured.')
        : 'Could not load laufar.'
      : null

  return (
    <StudioLayout
      railLabel={terms.laufar}
      contextBar={
        <HlidskjalfContextBar
          inspectorPinned={inspectorPinned}
          onInspectorPinnedChange={setInspectorPinned}
          onAddLauf={() => selectLaufar('new')}
          onAddGreinar={() => startAddCatalogEntity('greinar')}
          onAddRunir={() => startAddCatalogEntity('runir')}
        />
      }
      rail={
        <HlidskjalfLaufarRail
          groups={laufarGroups}
          selectedId={laufarId && laufarId !== 'new' ? laufarId : null}
          filterQuery={laufarFilter}
          onFilterQueryChange={setLaufarFilter}
          greinFilterId={greinFilterId}
          onGreinFilterChange={setGreinFilterId}
          runirFilterId={runirFilterId}
          onRunirFilterChange={setRunirFilterId}
          greinar={hlidskjalfGreinar}
          runir={hlidskjalfRunir}
          onInspect={selectLaufar}
          onOpenUrl={(url) => window.open(url, '_blank', 'noopener,noreferrer')}
          onOpenCatalog={() => openCatalog('greinar')}
          isLoading={laufarQuery.isLoading && !laufarQuery.data}
          unavailableMessage={laufarUnavailable}
        />
      }
      canvas={
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
          <HlidskjalfCanvas />
        </div>
      }
      inspectorState={inspectorState}
      inspectorHint={
        catalogTab
          ? `${terms.greinar} & ${terms.runir}`
          : laufarId
            ? terms.laufar
            : `Select a ${terms.laufarSingular.toLowerCase()}`
      }
      onDismissInspector={dismissInspector}
      inspector={
        catalogTab ? (
          <FjallCatalogInspector
            activeTab={catalogTab}
            onTabChange={(tab) => {
              patchParams((params) => {
                params.set('catalog', tab)
                params.delete('catalogId')
                params.delete('runPath')
                params.delete('runParent')
              })
            }}
            greinar={greinar}
            runir={hlidskjalfRunir}
            selectedId={catalogId}
            runPath={runPath}
            runParent={runParent}
            onSelectId={(id) => {
              patchParams((params) => {
                if (id) params.set('catalogId', id)
                else params.delete('catalogId')
              })
            }}
            onRunPathChange={(path) => {
              patchParams((params) => {
                if (path.length) params.set('runPath', path.join('/'))
                else params.delete('runPath')
                params.delete('catalogId')
              })
            }}
            onRunParentChange={(parent) => {
              patchParams((params) => {
                if (parent) params.set('runParent', parent)
                else params.delete('runParent')
              })
            }}
            onClearSelection={() => {
              patchParams((params) => {
                params.delete('catalogId')
                params.delete('runParent')
              })
            }}
          />
        ) : laufarId ? (
          <LaufInspector
            lauf={selectedLauf}
            isNew={isNewLaufar}
            greinar={hlidskjalfGreinar}
            runir={hlidskjalfRunir}
            onClose={clearCatalogSelection}
            onSave={async (values) => {
              await saveLaufMutation.mutateAsync(values)
            }}
            onDelete={async () => {
              await deleteLaufMutation.mutateAsync()
            }}
            isSaving={saveLaufMutation.isPending}
          />
        ) : inspectorPinned ? (
          <div className="flex h-full items-center justify-center px-4 text-center text-sm text-muted-foreground">
            Select a {terms.laufarSingular.toLowerCase()}, or open {terms.greinar.toLowerCase()} &{' '}
            {terms.runir.toLowerCase()}.
          </div>
        ) : null
      }
    />
  )
}

import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useTerminology } from '@/hooks/use-terminology'
import { fetchCairnHealth } from '@/lib/cairn-client'
import { CAIRN_API_URL } from '@/lib/config'

export function BasecampPage() {
  const { terms } = useTerminology()
  const health = useQuery({
    queryKey: ['cairn-health'],
    queryFn: fetchCairnHealth,
    retry: false,
    refetchInterval: 60_000,
  })

  const snapshots = [
    { name: terms.resume, to: '/ordstirr' },
    { name: terms.provisions, to: '/audr' },
    { name: terms.calendar, to: '/dagatal' },
    { name: terms.messages, to: '/sendibod' },
  ] as const

  const rows = [
    {
      title: terms.notes,
      hint: 'Logbook cards — port Cairn Summit Basecamp trail/log rows',
      to: '/sogur',
    },
    {
      title: terms.resume,
      hint: 'Manifest cards — Summit Basecamp pattern',
      to: '/ordstirr',
    },
    {
      title: terms.starfield,
      hint: 'Stjornur row — networks / outposts at a glance',
      to: '/stjornur',
    },
  ] as const

  return (
    <div className="space-y-10 px-6 py-8 sm:px-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-wide">{terms.basecamp}</h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
            Snapshot row + Summit-style card rows + Stjornur. No Spjold. Data from{' '}
            <code>{CAIRN_API_URL}</code>.
          </p>
        </div>
        <p className="text-xs text-[var(--muted-foreground)]">
          Cairn API:{' '}
          {health.isLoading
            ? 'checking…'
            : health.data?.ok
              ? `reachable (${health.data.status})`
              : `unreachable / blocked (${health.data?.status ?? 'network'}) — see CORS checklist`}
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Snapshots
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {snapshots.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-5 transition-colors hover:border-[var(--primary)]/40"
            >
              <p className="text-sm font-medium">{item.name}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Open app</p>
            </Link>
          ))}
        </div>
      </section>

      {rows.map((row) => (
        <section key={row.title}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {row.title}
            </h2>
            <Link to={row.to} className="text-xs text-[var(--primary)] hover:underline">
              Open
            </Link>
          </div>
          <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted-foreground)]">
            {row.hint}
          </div>
        </section>
      ))}
    </div>
  )
}

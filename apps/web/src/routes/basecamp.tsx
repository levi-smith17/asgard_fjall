const SNAPSHOTS = ['Ordstirr', 'Audr', 'Dagatal', 'Sendibod'] as const
const CARD_ROWS = [
  { title: 'Sogur', hint: 'Logbooks — port from Cairn Summit Basecamp' },
  { title: 'Ordstirr', hint: 'Manifest cards — Summit Basecamp pattern' },
  { title: 'Stjornur', hint: 'New row for starfield planner' },
] as const

export function BasecampPage() {
  return (
    <div className="space-y-10 px-6 py-8 sm:px-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-wide">Basecamp</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--muted-foreground)]">
          Snapshot row (Asgard) + card rows (Summit Basecamp) + Stjornur. No Spjold. Data from Cairn
          API only.
        </p>
      </header>

      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
          Snapshots
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {SNAPSHOTS.map((name) => (
            <div
              key={name}
              className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/40 px-4 py-5"
            >
              <p className="text-sm font-medium">{name}</p>
              <p className="mt-1 text-xs text-[var(--muted-foreground)]">Cairn snapshot stub</p>
            </div>
          ))}
        </div>
      </section>

      {CARD_ROWS.map((row) => (
        <section key={row.title}>
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            {row.title}
          </h2>
          <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-8 text-sm text-[var(--muted-foreground)]">
            {row.hint}
          </div>
        </section>
      ))}
    </div>
  )
}

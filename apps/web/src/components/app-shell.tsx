import { NavLink, Outlet } from 'react-router-dom'
import { useTerminology } from '@/hooks/use-terminology'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { terms, style, setStyle } = useTerminology()

  const nav = [
    { to: '/basecamp', label: terms.basecamp },
    { to: '/audr', label: terms.provisions },
    { to: '/dagatal', label: terms.calendar },
    { to: '/ordstirr', label: terms.resume },
    { to: '/sogur', label: terms.notes },
    { to: '/stjornur', label: terms.starfield },
    { to: '/sendibod', label: terms.messages },
  ] as const

  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
        <div className="flex h-16 flex-col justify-center gap-1 border-b border-[var(--border)] px-4">
          <span className="text-lg font-bold tracking-[0.2em] text-[var(--primary)] uppercase">
            {terms.productName}
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            {terms.productSubtitle}
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'rounded-md px-3 py-2 text-sm transition-colors',
                  isActive
                    ? 'bg-[var(--muted)] text-[var(--foreground)]'
                    : 'text-[var(--muted-foreground)] hover:bg-[var(--muted)] hover:text-[var(--foreground)]',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="border-t border-[var(--border)] p-3">
          <label className="block text-[10px] uppercase tracking-wider text-[var(--muted-foreground)]">
            Terms
          </label>
          <select
            className="mt-1 w-full rounded-md border border-[var(--border)] bg-[var(--muted)] px-2 py-1.5 text-xs"
            value={style}
            onChange={(e) => setStyle(e.target.value as typeof style)}
          >
            <option value="ASGARD">Asgard</option>
            <option value="CAIRN">Cairn</option>
            <option value="STANDARD">Standard</option>
          </select>
        </div>
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

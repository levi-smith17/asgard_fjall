import { NavLink, Outlet } from 'react-router-dom'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/basecamp', label: 'Basecamp' },
  { to: '/audr', label: 'Audr' },
  { to: '/dagatal', label: 'Dagatal' },
  { to: '/ordstirr', label: 'Ordstirr' },
  { to: '/sogur', label: 'Sogur' },
  { to: '/stjornur', label: 'Stjornur' },
  { to: '/sendibod', label: 'Sendibod' },
] as const

export function AppShell() {
  return (
    <div className="flex h-full min-h-0">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--border)] bg-[var(--sidebar)]">
        <div className="flex h-16 items-center gap-3 border-b border-[var(--border)] px-4">
          <span className="text-lg font-bold tracking-[0.2em] text-[var(--primary)] uppercase">
            Asgard
          </span>
          <span className="text-xs font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Fjall
          </span>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-2">
          {NAV.map((item) => (
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
      </aside>
      <main className="min-h-0 min-w-0 flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

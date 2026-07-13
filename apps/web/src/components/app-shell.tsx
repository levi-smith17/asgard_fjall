import { Link, Outlet, useLocation } from 'react-router-dom'
import { BookType, LogOut, Moon, Palette, Sun } from 'lucide-react'
import { AsgardSidebarBrand } from '@/components/core/brand/asgard-sidebar-brand'
import { CommandPaletteDialog } from '@/components/core/command-palette/command-palette-dialog'
import { ValknutWatermark } from '@/components/core/icons/valknut-watermark'
import { SidebarUtilitiesFlyout } from '@/components/core/shell/sidebar-utilities-flyout'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useAuth } from '@/hooks/use-auth'
import { usePalette } from '@/hooks/use-palette'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { useTerminology } from '@/hooks/use-terminology'
import { useTheme } from '@/hooks/use-theme'
import { getFjallNavItems } from '@/lib/fjall-nav'
import { cn } from '@/lib/utils'

export function AppShell() {
  const { pathname } = useLocation()
  const auth = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { terms, cycleTerminology, toggleTooltip } = useTerminology()
  const { cyclePalette, toggleTooltip: paletteTooltip } = usePalette()
  const { isDesktop, isNarrow, desktopCollapsed, toggleDesktopCollapsed } = useSidebarCollapsed()
  const nav = getFjallNavItems(terms)

  const displayName = auth.user?.email?.split('@')[0] ?? 'Guest'
  const displayEmail = auth.user?.email ?? ''
  const avatarFallback = displayName.slice(0, 2)

  return (
    <>
      <div
        className="flex h-full overflow-hidden"
        data-sidebar-collapsed={isDesktop && desktopCollapsed ? 'true' : undefined}
      >
        <aside className="relative z-40 flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-column-shell transition-[width] duration-200 ease-out">
          <AsgardSidebarBrand narrow={isNarrow} />

          <nav className={cn('flex-1 overflow-y-auto py-3', isNarrow ? 'px-1.5' : 'px-2 py-4')}>
            <ul className="space-y-0.5">
              {nav.map((item) => {
                const Icon = item.icon
                const active = pathname.startsWith(item.href)
                const itemClass = cn(
                  'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
                  isNarrow
                    ? 'justify-center px-0 py-2.5'
                    : 'justify-start gap-2.5 px-3 py-2',
                  active
                    ? 'bg-sidebar-accent text-sidebar-foreground-active'
                    : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
                )

                const content = (
                  <>
                    <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
                    {!isNarrow ? <span className="truncate">{item.label}</span> : null}
                  </>
                )

                const link = (
                  <Link to={item.href} className={itemClass} aria-label={item.label}>
                    {content}
                  </Link>
                )

                return (
                  <li key={item.key}>
                    {isNarrow ? (
                      <ToolbarTooltip label={item.label} placement="right">
                        {link}
                      </ToolbarTooltip>
                    ) : (
                      link
                    )}
                  </li>
                )
              })}
            </ul>
          </nav>

          <div className={cn('border-t border-sidebar-border py-3', isNarrow ? 'px-2' : 'px-3')}>
            {isNarrow ? (
              <div className="flex flex-col items-center gap-1">
                <SidebarUtilitiesFlyout />
                <div className="mt-2 -mx-2 self-stretch border-t border-sidebar-border pt-2">
                  <div className="flex justify-center">
                    <ToolbarTooltip label={displayName} placement="right">
                      <Avatar alt={displayName} fallback={avatarFallback} />
                    </ToolbarTooltip>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid w-full grid-cols-3 gap-1">
                  <ToolbarTooltip label={toggleTooltip}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-full"
                      onClick={cycleTerminology}
                      aria-label={toggleTooltip}
                    >
                      <BookType className="h-4 w-4" />
                    </Button>
                  </ToolbarTooltip>
                  <ToolbarTooltip label={paletteTooltip}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-full"
                      onClick={cyclePalette}
                      aria-label={paletteTooltip}
                    >
                      <Palette className="h-4 w-4" />
                    </Button>
                  </ToolbarTooltip>
                  <ToolbarTooltip label={theme === 'dark' ? 'Ljos' : 'Mrykr'}>
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-full"
                      onClick={toggleTheme}
                      aria-label={theme === 'dark' ? 'Ljos' : 'Mrykr'}
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </ToolbarTooltip>
                </div>
                <div className="mt-3 -mx-3 border-t border-sidebar-border pt-3">
                  <div className="flex items-center gap-2 px-3">
                    <Avatar alt={displayName} fallback={avatarFallback} />
                    <div className="min-w-0 flex-1 text-left text-sm leading-tight">
                      <p className="truncate font-medium text-foreground">{displayName}</p>
                      {displayEmail ? (
                        <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                      ) : null}
                    </div>
                    {auth.user ? (
                      <ToolbarTooltip label="Sign out">
                        <Button
                          type="button"
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 shrink-0"
                          onClick={() => auth.signOut()}
                          aria-label="Sign out"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </ToolbarTooltip>
                    ) : null}
                  </div>
                </div>
              </>
            )}
          </div>

          {isDesktop ? (
            <button
              type="button"
              className={cn(
                'absolute inset-y-0 -right-1 z-50 w-2',
                'cursor-col-resize border-0 bg-transparent p-0',
                'hover:bg-primary/20 active:bg-primary/30',
              )}
              onDoubleClick={toggleDesktopCollapsed}
              aria-label={desktopCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              title={
                desktopCollapsed
                  ? 'Double-click to expand sidebar'
                  : 'Double-click to collapse sidebar'
              }
            />
          ) : null}
        </aside>

        <main className="relative z-0 flex min-w-0 flex-1 flex-col overflow-hidden">
          <ValknutWatermark />
          <div className="relative z-0 flex min-h-0 min-w-0 flex-1 flex-col">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandPaletteDialog />
    </>
  )
}

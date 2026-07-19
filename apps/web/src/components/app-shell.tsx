import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  ExternalLink,
  MessageSquare,
  type LucideIcon,
} from 'lucide-react'
import { AsgardSidebarBrand } from '@/components/core/brand/asgard-sidebar-brand'
import { CommandPaletteDialog } from '@/components/core/command-palette/command-palette-dialog'
import { ValknutWatermark } from '@/components/core/icons/valknut-watermark'
import { SidebarNavGroupFlyout } from '@/components/core/shell/sidebar-nav-group-flyout'
import { UserAccountMenu } from '@/components/core/shell/user-account-menu'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useAuth } from '@/hooks/use-auth'
import { useAppDocumentTitle } from '@/hooks/use-app-document-title'
import { usePalette } from '@/hooks/use-palette'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { useTerminology } from '@/hooks/use-terminology'
import { useTheme } from '@/hooks/use-theme'
import { fetchFjallProfile, fetchFjallSendibod, fetchFjallStatus } from '@/lib/data-api'
import { getFjallNavGroups } from '@/lib/fjall-nav'
import { parsePublicManifestPath, publicManifestPath } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

function themeToggleLabel(style: string, theme: string): string {
  if (style === 'ASGARD') return theme === 'dark' ? 'Ljos' : 'Mrykr'
  return theme === 'dark' ? 'Light' : 'Dark'
}

function navItemActive(pathname: string, key: string, href: string, external?: boolean): boolean {
  if (external) return false
  if (key === 'ordstirr') return pathname === href
  return pathname.startsWith(href)
}

export function AppShell() {
  const { pathname } = useLocation()
  const auth = useAuth()
  useAppDocumentTitle()
  const { theme, toggleTheme } = useTheme()
  const { terms, style, cycleTerminology, toggleTooltip } = useTerminology()
  const { cyclePalette, nextPalette } = usePalette()
  const paletteTooltip = nextPalette === 'green' ? terms.paletteGreen : terms.paletteGold
  const { isDesktop, isNarrow, desktopCollapsed, toggleDesktopCollapsed } = useSidebarCollapsed()
  const useGroupFlyouts = !isDesktop
  const groups = getFjallNavGroups(terms)
  const themeLabel = themeToggleLabel(style, theme)

  const statusQuery = useQuery({
    queryKey: ['fjall-status', auth.dataUser?.id ?? 'anon'],
    queryFn: fetchFjallStatus,
    enabled: auth.status === 'authenticated',
    retry: false,
    staleTime: 60_000,
  })

  const profileQuery = useQuery({
    queryKey: ['fjall-profile'],
    queryFn: fetchFjallProfile,
    enabled: Boolean(auth.dataUser) && statusQuery.data?.configured === true,
    retry: false,
    staleTime: 60_000,
  })

  const sendibodQuery = useQuery({
    queryKey: ['fjall-sendibod'],
    queryFn: fetchFjallSendibod,
    enabled: statusQuery.data?.configured === true,
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const unreadMessageCount = (sendibodQuery.data ?? []).filter((message) => !message.read).length
  const sendibodActive = pathname.startsWith('/sendibod')

  const displayName =
    profileQuery.data?.name ?? auth.gateUser?.email?.split('@')[0] ?? 'Guest'
  const displayEmail = profileQuery.data?.email ?? auth.gateUser?.email ?? ''
  const avatarUrl = profileQuery.data?.image ?? null
  const avatarFallback = displayName.slice(0, 2)
  const username = profileQuery.data?.username
  const publicOrdstirrHref = username ? publicManifestPath(username, 'manifest') : null
  const publicViewActive = Boolean(parsePublicManifestPath(pathname))

  function renderNavLink(item: {
    key: string
    label: string
    href: string
    icon: LucideIcon
    external?: boolean
  }) {
    const Icon = item.icon
    const active = navItemActive(pathname, item.key, item.href, item.external)
    const itemClass = cn(
      'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
      isNarrow ? 'justify-center px-0 py-2.5' : 'justify-start gap-2.5 px-3 py-2',
      active
        ? 'bg-sidebar-accent text-sidebar-foreground-active'
        : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
    )

    const content = (
      <>
        <Icon className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
        {!isNarrow ? (
          <>
            <span className="truncate">{item.label}</span>
            {item.external ? (
              <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
            ) : null}
          </>
        ) : null}
      </>
    )

    const link = item.external ? (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={itemClass}
        aria-label={item.label}
      >
        {content}
      </a>
    ) : (
      <Link to={item.href} className={itemClass} aria-label={item.label}>
        {content}
      </Link>
    )

    if (item.key === 'ordstirr' && publicOrdstirrHref) {
      if (isNarrow) {
        const bookLink = (
          <Link
            to={publicOrdstirrHref}
            aria-label={terms.publicViewGroup}
            className={cn(
              'flex w-full items-center rounded-lg text-sm font-medium transition-colors',
              'justify-center px-0 py-2.5',
              publicViewActive
                ? 'bg-sidebar-accent text-sidebar-foreground-active'
                : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
            )}
          >
            <BookOpen className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
          </Link>
        )

        return (
          <li key={item.key} className="flex w-full flex-col gap-0.5">
            <ToolbarTooltip label={item.label} placement="right" className="w-full">
              {link}
            </ToolbarTooltip>
            <ToolbarTooltip label={terms.publicViewGroup} placement="right" className="w-full">
              {bookLink}
            </ToolbarTooltip>
          </li>
        )
      }

      return (
        <li key={item.key} className="flex items-center gap-0.5">
          <div className="min-w-0 flex-1">{link}</div>
          <ToolbarTooltip label={terms.publicViewGroup} placement="above">
            <Link
              to={publicOrdstirrHref}
              aria-label={terms.publicViewGroup}
              className={cn(
                'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-medium transition-colors',
                publicViewActive
                  ? 'bg-sidebar-accent text-sidebar-foreground-active'
                  : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
              )}
            >
              <BookOpen className="h-[1.125rem] w-[1.125rem] shrink-0" aria-hidden />
            </Link>
          </ToolbarTooltip>
        </li>
      )
    }

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
  }

  return (
    <>
      <div
        className="flex h-full overflow-hidden"
        data-sidebar-collapsed={isDesktop && desktopCollapsed ? 'true' : undefined}
      >
        <aside className="relative z-40 flex w-[var(--sidebar-width)] shrink-0 flex-col border-r border-sidebar-border bg-column-shell transition-[width] duration-200 ease-out">
          <AsgardSidebarBrand narrow={isNarrow} />

          <nav className={cn('flex-1 overflow-y-auto', isNarrow ? 'px-1.5' : 'px-2 py-4')}>
            {groups.map((group, groupIndex) => {
              const collapseToFlyout = useGroupFlyouts && !group.neverCollapse
              return (
                <div key={group.id}>
                  {groupIndex > 0 ? (
                    <div
                      className={cn(
                        'border-t border-sidebar-border',
                        isNarrow ? '-mx-1.5' : '-mx-2 my-4',
                      )}
                    />
                  ) : null}

                  <div className={cn(isNarrow && 'py-2')}>
                    {collapseToFlyout ? (
                      <ul className="w-full space-y-0.5">
                        <li>
                          <SidebarNavGroupFlyout
                            items={group.items.map((item) => ({
                              ...item,
                              enabled: true,
                            }))}
                            groupLabel={group.label}
                            groupIcon={group.icon}
                            publicViewLabel={terms.publicViewGroup}
                            publicUsername={group.id === 'personal' ? username : undefined}
                          />
                        </li>
                      </ul>
                    ) : (
                      <>
                        {!isNarrow ? (
                          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                            {group.label}
                          </p>
                        ) : null}
                        <ul className="w-full space-y-0.5">
                          {group.items.map((item) => renderNavLink(item))}
                        </ul>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </nav>

          <div
            className={cn(
              'border-t border-sidebar-border',
              isNarrow ? 'px-1.5 pt-2' : 'px-3 py-3',
            )}
          >
            {unreadMessageCount > 0 ? (
              <div className={cn(isNarrow ? 'w-full pb-2' : 'mb-2')}>
                <ToolbarTooltip
                  label={`${terms.messages} — ${unreadMessageCount} unread`}
                  placement={isNarrow ? 'right' : 'above'}
                  className="w-full"
                >
                  <Button
                    asChild
                    variant="secondary"
                    size="icon"
                    className={cn(
                      'relative h-8 w-full',
                      sendibodActive &&
                        'bg-sidebar-accent text-sidebar-foreground-active hover:bg-sidebar-accent',
                    )}
                  >
                    <Link
                      to="/sendibod"
                      aria-label={`${terms.messages} — ${unreadMessageCount} unread`}
                    >
                      <MessageSquare className="h-4 w-4" />
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                      </span>
                    </Link>
                  </Button>
                </ToolbarTooltip>
              </div>
            ) : null}
            {isNarrow ? (
              <div className="-mx-1.5 w-[calc(100%+0.75rem)] border-t border-sidebar-border">
                <UserAccountMenu
                  collapsed
                  displayName={displayName}
                  displayEmail={displayEmail}
                  avatarUrl={avatarUrl}
                  avatarFallback={avatarFallback}
                  messagesLabel={terms.messages}
                  messagesTo="/sendibod"
                  messagesActive={sendibodActive}
                  unreadMessageCount={unreadMessageCount}
                  settingsLabel={terms.settings}
                  settingsTo="/thing"
                  settingsActive={pathname.startsWith('/thing')}
                  terminologyLabel={toggleTooltip}
                  onCycleTerminology={cycleTerminology}
                  paletteLabel={paletteTooltip}
                  onCyclePalette={cyclePalette}
                  themeLabel={themeLabel}
                  theme={theme}
                  onToggleTheme={toggleTheme}
                  appearanceGroupLabel={terms.appearanceGroup}
                  affairsGroupLabel={terms.affairsGroup}
                />
              </div>
            ) : (
              <UserAccountMenu
                displayName={displayName}
                displayEmail={displayEmail}
                avatarUrl={avatarUrl}
                avatarFallback={avatarFallback}
                messagesLabel={terms.messages}
                messagesTo="/sendibod"
                messagesActive={sendibodActive}
                unreadMessageCount={unreadMessageCount}
                settingsLabel={terms.settings}
                settingsTo="/thing"
                settingsActive={pathname.startsWith('/thing')}
                terminologyLabel={toggleTooltip}
                onCycleTerminology={cycleTerminology}
                paletteLabel={paletteTooltip}
                onCyclePalette={cyclePalette}
                themeLabel={themeLabel}
                theme={theme}
                onToggleTheme={toggleTheme}
                appearanceGroupLabel={terms.appearanceGroup}
                affairsGroupLabel={terms.affairsGroup}
              />
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

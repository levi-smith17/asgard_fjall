import { Link, Outlet, useLocation } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookOpen,
  BookType,
  ExternalLink,
  MessageSquare,
  Moon,
  MoreHorizontal,
  Palette,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { AsgardSidebarBrand } from '@/components/core/brand/asgard-sidebar-brand'
import { CommandPaletteDialog } from '@/components/core/command-palette/command-palette-dialog'
import { ValknutWatermark } from '@/components/core/icons/valknut-watermark'
import { SidebarFooterFlyout } from '@/components/core/shell/sidebar-footer-flyout'
import { SidebarNavGroupFlyout } from '@/components/core/shell/sidebar-nav-group-flyout'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useAuth } from '@/hooks/use-auth'
import { useAppDocumentTitle } from '@/hooks/use-app-document-title'
import { usePalette } from '@/hooks/use-palette'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { useTerminology } from '@/hooks/use-terminology'
import { useTheme } from '@/hooks/use-theme'
import { fetchFjallProfile, fetchFjallSignals, fetchFjallStatus } from '@/lib/data-api'
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

  const signalsQuery = useQuery({
    queryKey: ['fjall-signals'],
    queryFn: fetchFjallSignals,
    enabled: statusQuery.data?.configured === true,
    retry: false,
    staleTime: 60_000,
    refetchInterval: 60_000,
  })

  const unreadMessageCount = (signalsQuery.data ?? []).filter((signal) => !signal.read).length
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
            {isNarrow ? (
              <div className="flex w-full flex-col items-center">
                <div className="w-full pb-2">
                  <SidebarFooterFlyout
                    triggerLabel="More"
                    trigger={
                      <span className="relative">
                        <MoreHorizontal className="h-4 w-4" aria-hidden />
                        {unreadMessageCount > 0 ? (
                          <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                          </span>
                        ) : null}
                      </span>
                    }
                    items={[
                      {
                        key: 'sendibod',
                        label: terms.messages,
                        to: '/sendibod',
                        active: sendibodActive,
                        icon: <MessageSquare className="h-4 w-4" />,
                        badge:
                          unreadMessageCount > 0 ? (
                            <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground tabular-nums">
                              {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                            </span>
                          ) : null,
                      },
                      {
                        key: 'terminology',
                        label: toggleTooltip,
                        icon: <BookType className="h-4 w-4" />,
                        onSelect: cycleTerminology,
                      },
                      {
                        key: 'palette',
                        label: paletteTooltip,
                        icon: <Palette className="h-4 w-4" />,
                        onSelect: cyclePalette,
                      },
                      {
                        key: 'theme',
                        label: themeLabel,
                        icon:
                          theme === 'dark' ? (
                            <Sun className="h-4 w-4" />
                          ) : (
                            <Moon className="h-4 w-4" />
                          ),
                        onSelect: toggleTheme,
                      },
                      {
                        key: 'settings',
                        label: terms.settings,
                        to: '/thing',
                        active: pathname.startsWith('/thing'),
                        icon: <Settings className="h-4 w-4" />,
                      },
                    ]}
                  />
                </div>
                <div className="-mx-1.5 w-[calc(100%+0.75rem)] border-t border-sidebar-border">
                  <ToolbarTooltip label={displayName} placement="right" className="w-full">
                    <div className="flex w-full items-center justify-center px-0 py-2.5">
                      <Avatar src={avatarUrl} alt={displayName} fallback={avatarFallback} />
                    </div>
                  </ToolbarTooltip>
                </div>
              </div>
            ) : (
              <>
                <div className="grid w-full grid-cols-5 gap-1">
                  <ToolbarTooltip label={terms.messages} className="w-full">
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
                        aria-label={
                          unreadMessageCount > 0
                            ? `${terms.messages} — ${unreadMessageCount} unread`
                            : terms.messages
                        }
                      >
                        <MessageSquare className="h-4 w-4" />
                        {unreadMessageCount > 0 ? (
                          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                            {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                          </span>
                        ) : null}
                      </Link>
                    </Button>
                  </ToolbarTooltip>
                  <ToolbarTooltip label={toggleTooltip} className="w-full">
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
                  <ToolbarTooltip label={paletteTooltip} className="w-full">
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
                  <ToolbarTooltip label={themeLabel} className="w-full">
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-full"
                      onClick={toggleTheme}
                      aria-label={themeLabel}
                    >
                      {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                  </ToolbarTooltip>
                  <ToolbarTooltip label={terms.settings} className="w-full">
                    <Button
                      asChild
                      variant="secondary"
                      size="icon"
                      className={cn(
                        'h-8 w-full',
                        pathname.startsWith('/thing') &&
                          'bg-sidebar-accent text-sidebar-foreground-active hover:bg-sidebar-accent',
                      )}
                    >
                      <Link to="/thing" aria-label={terms.settings}>
                        <Settings className="h-4 w-4" />
                      </Link>
                    </Button>
                  </ToolbarTooltip>
                </div>
                <div className="mt-3 -mx-3 border-t border-sidebar-border pt-3">
                  <div className="flex items-center gap-2 px-3">
                    <Avatar src={avatarUrl} alt={displayName} fallback={avatarFallback} />
                    <div className="min-w-0 flex-1 text-left text-sm leading-tight">
                      <p className="truncate font-medium text-foreground">{displayName}</p>
                      {displayEmail ? (
                        <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
                      ) : null}
                    </div>
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

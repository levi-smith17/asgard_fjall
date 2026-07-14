import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  BookType,
  ChevronsUpDown,
  ExternalLink,
  LogOut,
  Moon,
  Palette,
  Settings,
  Sun,
  type LucideIcon,
} from 'lucide-react'
import { AsgardSidebarBrand } from '@/components/core/brand/asgard-sidebar-brand'
import { CommandPaletteDialog } from '@/components/core/command-palette/command-palette-dialog'
import { ValknutWatermark } from '@/components/core/icons/valknut-watermark'
import { SidebarUtilitiesFlyout } from '@/components/core/shell/sidebar-utilities-flyout'
import { Avatar } from '@/components/core/ui/avatar'
import { Button } from '@/components/core/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/core/ui/popover'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useAuth } from '@/hooks/use-auth'
import { usePalette } from '@/hooks/use-palette'
import { useSidebarCollapsed } from '@/hooks/use-sidebar-collapsed'
import { useTerminology } from '@/hooks/use-terminology'
import { useTheme } from '@/hooks/use-theme'
import { fetchCairnProfile, fetchCairnStatus } from '@/lib/cairn-api'
import { getFjallNavItems } from '@/lib/fjall-nav'
import { buildPublicViewLinks } from '@/lib/public-view-nav'
import { parsePublicManifestPath } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

function themeToggleLabel(style: string, theme: string): string {
  if (style === 'ASGARD') return theme === 'dark' ? 'Ljos' : 'Mrykr'
  return theme === 'dark' ? 'Light' : 'Dark'
}

function SidebarGroupLabel({
  children,
  className,
  narrow,
}: {
  children: React.ReactNode
  className?: string
  narrow: boolean
}) {
  if (narrow) return null
  return (
    <div
      className={cn(
        'flex h-8 shrink-0 items-center rounded-md px-3 text-xs font-medium text-sidebar-foreground/70',
        className,
      )}
    >
      {children}
    </div>
  )
}

function ProfilePopover({
  displayName,
  displayEmail,
  avatarUrl,
  avatarFallback,
  isNarrow,
  onSignOut,
}: {
  displayName: string
  displayEmail: string
  avatarUrl: string | null
  avatarFallback: string
  isNarrow: boolean
  onSignOut: () => void
}) {
  const trigger = (
    <button
      type="button"
      className={cn(
        'flex w-full items-center rounded-lg text-left transition-colors',
        isNarrow
          ? 'justify-center p-1 hover:bg-muted-hover'
          : 'gap-2 px-3 py-1.5 hover:bg-muted-hover',
      )}
      aria-label="Account menu"
    >
      <Avatar src={avatarUrl} alt={displayName} fallback={avatarFallback} />
      {!isNarrow ? (
        <>
          <div className="min-w-0 flex-1 text-left text-sm leading-tight">
            <p className="truncate font-medium text-foreground">{displayName}</p>
            {displayEmail ? (
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            ) : null}
          </div>
          <ChevronsUpDown className="ml-auto size-4 shrink-0 text-muted-foreground" aria-hidden />
        </>
      ) : null}
    </button>
  )

  const popover = (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        side={isNarrow ? 'right' : 'top'}
        align={isNarrow ? 'end' : 'start'}
        className="w-56 space-y-3 p-3"
      >
        <div className="flex items-center gap-2">
          <Avatar src={avatarUrl} alt={displayName} fallback={avatarFallback} />
          <div className="min-w-0 space-y-0.5">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            {displayEmail ? (
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            ) : null}
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          className="w-full justify-start gap-2"
          onClick={onSignOut}
        >
          <LogOut className="h-4 w-4" aria-hidden />
          Log out
        </Button>
      </PopoverContent>
    </Popover>
  )

  if (isNarrow) {
    return (
      <ToolbarTooltip label={displayName} placement="right">
        {popover}
      </ToolbarTooltip>
    )
  }

  return popover
}

export function AppShell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const auth = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { terms, style, cycleTerminology, toggleTooltip } = useTerminology()
  const { cyclePalette, toggleTooltip: paletteTooltip } = usePalette()
  const { isDesktop, isNarrow, desktopCollapsed, toggleDesktopCollapsed } = useSidebarCollapsed()
  const nav = getFjallNavItems(terms)
  const themeLabel = themeToggleLabel(style, theme)

  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
    staleTime: 60_000,
  })

  const profileQuery = useQuery({
    queryKey: ['cairn-profile'],
    queryFn: fetchCairnProfile,
    enabled: Boolean(auth.user) && statusQuery.data?.configured === true,
    retry: false,
    staleTime: 60_000,
  })

  const displayName =
    profileQuery.data?.name ?? auth.user?.email?.split('@')[0] ?? 'Guest'
  const displayEmail = profileQuery.data?.email ?? auth.user?.email ?? ''
  const avatarUrl = profileQuery.data?.image ?? null
  const avatarFallback = displayName.slice(0, 2)
  const username = profileQuery.data?.username
  const publicLinks = username ? buildPublicViewLinks(username, terms) : []
  const publicProfile = parsePublicManifestPath(pathname)

  function handleSignOut() {
    auth.signOut()
    navigate('/login', { replace: true })
  }

  function renderNavLink(item: {
    key: string
    label: string
    href: string
    icon: LucideIcon
    active?: boolean
    external?: boolean
  }) {
    const Icon = item.icon
    const active = item.external ? false : (item.active ?? pathname.startsWith(item.href))
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

          <nav className={cn('flex-1 overflow-y-auto py-3', isNarrow ? 'px-1.5' : 'px-2 py-4')}>
            <div>
              <SidebarGroupLabel narrow={isNarrow}>{terms.platformGroup}</SidebarGroupLabel>
              <ul className="space-y-0.5">{nav.map((item) => renderNavLink(item))}</ul>
            </div>

            {publicLinks.length > 0 ? (
              <div className={cn(isNarrow ? 'mt-2' : 'mt-3')}>
                {!isNarrow ? (
                  <div className="-mx-2 mb-3 border-t border-sidebar-border" />
                ) : null}
                <SidebarGroupLabel narrow={isNarrow}>
                  {terms.publicViewGroup}
                </SidebarGroupLabel>
                <ul className="space-y-0.5">
                  {publicLinks.map((item) =>
                    renderNavLink({
                      key: item.key,
                      label: item.label,
                      href: item.href,
                      icon: item.icon,
                      active: publicProfile?.view === item.view,
                    }),
                  )}
                </ul>
              </div>
            ) : null}
          </nav>

          <div className={cn('border-t border-sidebar-border py-3', isNarrow ? 'px-2' : 'px-3')}>
            {isNarrow ? (
              <div className="flex flex-col items-center gap-1">
                <SidebarUtilitiesFlyout />
                <div className="mt-2 -mx-2 self-stretch border-t border-sidebar-border pt-2">
                  <div className="flex justify-center">
                    <ProfilePopover
                      displayName={displayName}
                      displayEmail={displayEmail}
                      avatarUrl={avatarUrl}
                      avatarFallback={avatarFallback}
                      isNarrow
                      onSignOut={handleSignOut}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className="grid w-full grid-cols-4 gap-1">
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
                  <ToolbarTooltip label={themeLabel}>
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
                  <ToolbarTooltip label={terms.settings}>
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
                  <ProfilePopover
                    displayName={displayName}
                    displayEmail={displayEmail}
                    avatarUrl={avatarUrl}
                    avatarFallback={avatarFallback}
                    isNarrow={false}
                    onSignOut={handleSignOut}
                  />
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

import { useEffect, useLayoutEffect, useRef, useState, type ComponentType } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { BookOpen, ExternalLink, Loader2 } from 'lucide-react'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { publicManifestPath } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

export type SidebarFlyoutNavItem = {
  key: string
  label: string
  href: string
  icon: ComponentType<{ className?: string }>
  enabled: boolean
  external?: boolean
  /** Optional status badge (e.g. unread alerts). */
  badgeCount?: number
  /** Optional busy spinner (e.g. pipeline deploy). */
  busy?: boolean
}

/** Collapses a sidebar nav group into a flyout on the narrow sidebar. */
export function SidebarNavGroupFlyout({
  items,
  groupLabel,
  groupIcon: GroupIcon,
  publicViewLabel = 'Public View',
  publicUsername,
}: {
  items: SidebarFlyoutNavItem[]
  groupLabel: string
  groupIcon: ComponentType<{ className?: string }>
  publicViewLabel?: string
  /** When set, Ordstirr row includes a Public View (book) shortcut. */
  publicUsername?: string | null
}) {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const publicPath = publicUsername ? publicManifestPath(publicUsername, 'manifest') : null
  const anyActive =
    items.some((item) => {
      if (!item.enabled || item.external) return false
      if (item.key === 'pipelines') return pathname.startsWith('/skidbladnir')
      if (item.key === 'ordstirr') return pathname === item.href
      return pathname.startsWith(item.href)
    }) || (publicPath != null && pathname.startsWith(publicPath))
  const groupBusy = items.some((item) => item.busy)
  const groupBadge = items.reduce((sum, item) => sum + (item.badgeCount ?? 0), 0)

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null)
      return
    }
    const update = () => {
      const el = triggerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const estimatedHeight = Math.min(items.length * 40 + 16, window.innerHeight - 16)
      const preferredTop = rect.bottom - estimatedHeight
      const top = Math.max(8, Math.min(preferredTop, window.innerHeight - estimatedHeight - 8))
      setMenuPos({ top, left: rect.right + 8 })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [open, items.length])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  const trigger = (
    <button
      ref={triggerRef}
      type="button"
      onClick={() => setOpen((current) => !current)}
      className={cn(
        'relative flex w-full items-center justify-center rounded-lg px-0 py-2.5 text-sm font-medium transition-colors',
        anyActive || open
          ? 'bg-sidebar-accent text-sidebar-foreground-active'
          : 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
      )}
      aria-label={groupLabel}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      <GroupIcon className="h-[1.125rem] w-[1.125rem]" aria-hidden />
      {groupBusy ? (
        <Loader2 className="absolute -right-1 -top-1 h-3 w-3 animate-spin text-info" aria-hidden />
      ) : null}
      {!groupBusy && groupBadge > 0 ? (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
          {groupBadge > 9 ? '9+' : groupBadge}
        </span>
      ) : null}
    </button>
  )

  return (
    <>
      {open ? (
        trigger
      ) : (
        <ToolbarTooltip label={groupLabel} placement="right">
          {trigger}
        </ToolbarTooltip>
      )}

      {open && menuPos
        ? createPortal(
            <>
              <button
                type="button"
                className="fixed inset-0 z-40 cursor-default bg-transparent"
                aria-label={`Close ${groupLabel} menu`}
                onClick={() => setOpen(false)}
              />
              <div
                role="menu"
                className="fixed z-50 w-56 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
                style={{ top: menuPos.top, left: menuPos.left }}
              >
                {items.map((item) => {
                  const Icon = item.icon
                  const active =
                    !item.external &&
                    item.enabled &&
                    (item.key === 'pipelines'
                      ? pathname.startsWith('/skidbladnir')
                      : item.key === 'ordstirr'
                        ? pathname === item.href
                        : pathname.startsWith(item.href))
                  const className = cn(
                    'flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted-hover',
                    !item.enabled && 'cursor-not-allowed opacity-50',
                  )
                  const publicActive = Boolean(publicPath && pathname.startsWith(publicPath))

                  if (item.key === 'ordstirr' && publicPath) {
                    return (
                      <div key={item.key} className="flex flex-col">
                        {!item.enabled ? (
                          <div className={className} role="menuitem" aria-disabled>
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{item.label}</span>
                          </div>
                        ) : (
                          <Link
                            to={item.href}
                            role="menuitem"
                            className={className}
                            onClick={() => setOpen(false)}
                          >
                            <Icon className="h-4 w-4 shrink-0" aria-hidden />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        )}
                        <Link
                          to={publicPath}
                          role="menuitem"
                          aria-label={publicViewLabel}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors',
                            publicActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-foreground hover:bg-muted-hover',
                          )}
                        >
                          <BookOpen className="h-4 w-4 shrink-0" aria-hidden />
                          <span className="truncate">{publicViewLabel}</span>
                        </Link>
                      </div>
                    )
                  }

                  if (!item.enabled) {
                    return (
                      <div key={item.key} className={className} role="menuitem" aria-disabled>
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                        <span className="ml-auto text-[10px] uppercase tracking-wide text-muted-foreground">
                          Soon
                        </span>
                      </div>
                    )
                  }
                  if (item.external) {
                    return (
                      <a
                        key={item.key}
                        href={item.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        role="menuitem"
                        className={className}
                        onClick={() => setOpen(false)}
                      >
                        <Icon className="h-4 w-4 shrink-0" aria-hidden />
                        <span className="truncate">{item.label}</span>
                        <ExternalLink className="ml-auto h-3.5 w-3.5 shrink-0 opacity-60" aria-hidden />
                      </a>
                    )
                  }
                  return (
                    <Link
                      key={item.key}
                      to={item.href}
                      role="menuitem"
                      className={className}
                      onClick={() => setOpen(false)}
                    >
                      <Icon className="h-4 w-4 shrink-0" aria-hidden />
                      <span className="truncate">{item.label}</span>
                      {item.busy ? (
                        <Loader2 className="ml-auto h-3.5 w-3.5 shrink-0 animate-spin text-info" aria-hidden />
                      ) : null}
                      {!item.busy && item.badgeCount && item.badgeCount > 0 ? (
                        <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground tabular-nums">
                          {item.badgeCount > 99 ? '99+' : item.badgeCount}
                        </span>
                      ) : null}
                    </Link>
                  )
                })}
              </div>
            </>,
            document.body,
          )
        : null}
    </>
  )
}

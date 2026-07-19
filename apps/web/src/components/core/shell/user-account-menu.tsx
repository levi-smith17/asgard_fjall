import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  BookType,
  ChevronUp,
  LogOut,
  MessageSquare,
  Moon,
  Palette,
  Settings,
  Sun,
} from 'lucide-react'
import { Avatar } from '@/components/core/ui/avatar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useAuth } from '@/hooks/use-auth'
import { cn } from '@/lib/utils'

export type UserAccountMenuProps = {
  collapsed?: boolean
  displayName: string
  displayEmail: string
  avatarUrl?: string | null
  avatarFallback: string
  messagesLabel: string
  messagesTo: string
  messagesActive?: boolean
  unreadMessageCount?: number
  settingsLabel: string
  settingsTo: string
  settingsActive?: boolean
  terminologyLabel: string
  onCycleTerminology: () => void
  paletteLabel: string
  onCyclePalette: () => void
  themeLabel: string
  theme: string
  onToggleTheme: () => void
  appearanceGroupLabel: string
  affairsGroupLabel: string
}

function menuItemClass(options?: { active?: boolean; destructive?: boolean }) {
  return cn(
    'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm font-medium transition-colors',
    options?.destructive
      ? 'text-destructive hover:bg-destructive/10'
      : options?.active
        ? 'bg-primary/10 text-primary'
        : 'text-foreground hover:bg-muted-hover',
  )
}

function MenuButton({
  icon,
  label,
  badge,
  onClick,
  destructive,
}: {
  icon: ReactNode
  label: string
  badge?: ReactNode
  onClick: () => void
  destructive?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      className={menuItemClass({ destructive })}
      onClick={onClick}
    >
      <span className="relative shrink-0">{icon}</span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {badge}
    </button>
  )
}

function GroupHeader({ label }: { label: string }) {
  return (
    <p className="px-3 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
      {label}
    </p>
  )
}

export function UserAccountMenu({
  collapsed = false,
  displayName,
  displayEmail,
  avatarUrl,
  avatarFallback,
  messagesLabel,
  messagesTo,
  messagesActive = false,
  unreadMessageCount = 0,
  settingsLabel,
  settingsTo,
  settingsActive = false,
  terminologyLabel,
  onCycleTerminology,
  paletteLabel,
  onCyclePalette,
  themeLabel,
  theme,
  onToggleTheme,
  appearanceGroupLabel,
  affairsGroupLabel,
}: UserAccountMenuProps) {
  const { signOut } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const menuId = useId()

  useEffect(() => {
    if (!open) return
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [open])

  async function handleSignOut() {
    setOpen(false)
    await signOut()
    navigate('/login', { replace: true })
  }

  const unreadBadge =
    unreadMessageCount > 0 ? (
      <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1.5 text-[10px] font-semibold text-destructive-foreground tabular-nums">
        {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
      </span>
    ) : null

  const trigger = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      aria-expanded={open}
      aria-haspopup="menu"
      aria-controls={menuId}
      aria-label={collapsed ? `${displayName}, account menu` : undefined}
      className={cn(
        'flex w-full items-center rounded-lg text-sm transition-colors',
        collapsed ? 'justify-center px-0 py-2.5' : 'gap-2.5 px-3 py-2',
        'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground',
        open && 'bg-muted-hover text-foreground',
      )}
    >
      <Avatar src={avatarUrl} alt={displayName} fallback={avatarFallback} />
      {!collapsed ? (
        <>
          <div className="min-w-0 flex-1 text-left leading-tight">
            <p className="truncate font-medium text-foreground">{displayName}</p>
            {displayEmail ? (
              <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
            ) : null}
          </div>
          <ChevronUp
            className={cn(
              'h-4 w-4 shrink-0 text-muted-foreground transition-transform',
              open ? 'rotate-0' : 'rotate-180',
            )}
            aria-hidden
          />
        </>
      ) : null}
    </button>
  )

  const menu = open ? (
    <div
      id={menuId}
      role="menu"
      className={cn(
        'absolute z-50 min-w-[13rem] overflow-hidden rounded-lg border border-border bg-card py-1 text-card-foreground shadow-lg',
        collapsed ? 'bottom-0 left-full ml-2' : 'bottom-full left-0 right-0 mb-2',
      )}
    >
      <div className="border-b border-border px-3 py-2.5">
        <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
        {displayEmail ? (
          <p className="truncate text-xs text-muted-foreground">{displayEmail}</p>
        ) : null}
      </div>

      <div className="py-1">
        <GroupHeader label={appearanceGroupLabel} />
        <MenuButton
          icon={<BookType className="h-4 w-4" aria-hidden />}
          label={terminologyLabel}
          onClick={() => {
            onCycleTerminology()
            setOpen(false)
          }}
        />
        <MenuButton
          icon={<Palette className="h-4 w-4" aria-hidden />}
          label={paletteLabel}
          onClick={() => {
            onCyclePalette()
            setOpen(false)
          }}
        />
        <MenuButton
          icon={
            theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )
          }
          label={themeLabel}
          onClick={() => {
            onToggleTheme()
            setOpen(false)
          }}
        />
      </div>

      <div className="border-t border-border py-1">
        <GroupHeader label={affairsGroupLabel} />
        <Link
          to={messagesTo}
          role="menuitem"
          className={menuItemClass({ active: messagesActive })}
          onClick={() => setOpen(false)}
        >
          <MessageSquare className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{messagesLabel}</span>
          {unreadBadge}
        </Link>
        <Link
          to={settingsTo}
          role="menuitem"
          className={menuItemClass({ active: settingsActive })}
          onClick={() => setOpen(false)}
        >
          <Settings className="h-4 w-4 shrink-0" aria-hidden />
          <span className="min-w-0 flex-1 truncate">{settingsLabel}</span>
        </Link>
      </div>

      <div className="border-t border-border py-1">
        <MenuButton
          icon={<LogOut className="h-4 w-4" aria-hidden />}
          label="Sign out"
          destructive
          onClick={() => void handleSignOut()}
        />
      </div>
    </div>
  ) : null

  if (collapsed) {
    return (
      <div ref={rootRef} className="relative flex w-full justify-center">
        <ToolbarTooltip label={displayName} placement="right" className="w-full">
          {trigger}
        </ToolbarTooltip>
        {menu}
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative">
      {trigger}
      {menu}
    </div>
  )
}

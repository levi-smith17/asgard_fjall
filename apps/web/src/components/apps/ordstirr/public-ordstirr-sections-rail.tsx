import { Moon, Palette, Section, Sun } from 'lucide-react'
import { AsgardSidebarBrand } from '@/components/core/brand/asgard-sidebar-brand'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { Button } from '@/components/core/ui/button'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { usePalette } from '@/hooks/use-palette'
import { useTheme } from '@/hooks/use-theme'
import type {
  PublicOrdstirrRailGroup,
  PublicOrdstirrRailSectionId,
} from '@/lib/public-ordstirr-rail'
import type { PublicManifestView } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

function PublicSidebarFooter() {
  const { theme, toggleTheme } = useTheme()
  const { cyclePalette, toggleTooltip: paletteTooltip } = usePalette()
  const themeLabel = theme === 'dark' ? 'Light' : 'Dark'

  return (
    <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
      <div className="grid w-full grid-cols-2 gap-1">
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
      </div>
      <div className="mt-3 -mx-3 border-t border-sidebar-border pt-3">
        <p className="flex items-center justify-center gap-2 px-3 text-center text-[11px] leading-snug text-muted-foreground">
          <span>Built on project Asgard</span>
          <span className="h-3 w-px shrink-0 bg-sidebar-border" aria-hidden />
          <span>© 2026</span>
        </p>
      </div>
    </div>
  )
}

function SectionList({
  groups,
  activeSection,
  currentView,
  onSelectSection,
  sidebarStyle,
}: {
  groups: PublicOrdstirrRailGroup[]
  activeSection: PublicOrdstirrRailSectionId | null
  currentView: PublicManifestView
  onSelectSection: (sectionId: PublicOrdstirrRailSectionId) => void
  sidebarStyle: boolean
}) {
  return (
    <div
      className={cn(
        'min-h-0 flex-1 overflow-y-auto',
        sidebarStyle ? 'px-2 py-4' : 'px-2 py-3',
      )}
    >
      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 ? (
            <div
              className={cn(
                'border-t',
                sidebarStyle
                  ? 'my-4 -mx-2 border-sidebar-border'
                  : 'my-3 border-border',
              )}
              aria-hidden
            />
          ) : null}
          <p
            className={cn(
              'mb-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground',
              sidebarStyle ? 'px-3' : 'px-2',
            )}
          >
            {group.label}
          </p>
          <ul className="space-y-0.5">
            {group.sections.map((section) => {
              const Icon = section.icon
              const active = activeSection === section.id
              const onOtherPage = section.view !== currentView
              return (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => onSelectSection(section.id)}
                    className={cn(
                      'flex w-full items-center text-sm font-medium transition-colors',
                      sidebarStyle
                        ? 'justify-start gap-2.5 rounded-lg px-3 py-2'
                        : 'gap-2 rounded-md px-2 py-1.5 text-left',
                      active
                        ? sidebarStyle
                          ? 'bg-sidebar-accent text-sidebar-foreground-active'
                          : 'bg-primary/10 text-primary'
                        : sidebarStyle
                          ? 'text-sidebar-foreground hover:bg-muted-hover hover:text-foreground'
                          : 'text-foreground hover:bg-muted/60',
                      onOtherPage && !active && 'text-muted-foreground',
                    )}
                  >
                    <Icon
                      className={cn(
                        'shrink-0 opacity-70',
                        sidebarStyle ? 'h-[1.125rem] w-[1.125rem]' : 'h-3.5 w-3.5',
                      )}
                      aria-hidden
                    />
                    <span className="truncate">{section.label}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}

export function PublicOrdstirrSectionsRail({
  groups,
  activeSection,
  currentView,
  onSelectSection,
  variant = 'rail',
  brandName = 'Levi Smith',
}: {
  groups: PublicOrdstirrRailGroup[]
  activeSection: PublicOrdstirrRailSectionId | null
  currentView: PublicManifestView
  onSelectSection: (sectionId: PublicOrdstirrRailSectionId) => void
  /** `sidebar` = true public (apex) chrome; `rail` = embedded Almenningr. */
  variant?: 'rail' | 'sidebar'
  brandName?: string
}) {
  if (variant === 'sidebar') {
    return (
      <div className="flex h-full min-h-0 flex-col overflow-hidden bg-column-shell">
        <AsgardSidebarBrand narrow={false} subtitle={brandName} />
        <SectionList
          groups={groups}
          activeSection={activeSection}
          currentView={currentView}
          onSelectSection={onSelectSection}
          sidebarStyle
        />
        <PublicSidebarFooter />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <StudioRailTitle icon={Section}>Sections</StudioRailTitle>
      </div>
      <SectionList
        groups={groups}
        activeSection={activeSection}
        currentView={currentView}
        onSelectSection={onSelectSection}
        sidebarStyle={false}
      />
    </div>
  )
}

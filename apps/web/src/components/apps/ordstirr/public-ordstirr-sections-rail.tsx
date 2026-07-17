import { Moon, Palette, Section, Sun } from 'lucide-react'
import { AsgardTreeIcon } from '@/components/core/brand/asgard-tree-icon'
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

function PublicSidebarBrand({ name }: { name: string }) {
  return (
    <div className="flex h-[var(--sidebar-brand-height)] max-h-[var(--sidebar-brand-height)] shrink-0 items-center justify-start gap-3 border-b border-sidebar-border px-4">
      <AsgardTreeIcon className="h-[4.5rem] w-auto" />
      <div className="min-w-0 leading-none">
        <p className="truncate text-base font-semibold tracking-tight text-primary">{name}</p>
      </div>
    </div>
  )
}

function PublicSidebarFooter() {
  const { theme, toggleTheme } = useTheme()
  const { cyclePalette, toggleTooltip: paletteTooltip } = usePalette()
  const themeLabel = theme === 'dark' ? 'Light' : 'Dark'

  return (
    <div className="shrink-0 border-t border-sidebar-border px-3 py-3">
      <div className="flex items-center gap-1">
        <ToolbarTooltip label={paletteTooltip}>
          <Button
            type="button"
            variant="secondary"
            size="icon"
            className="h-8 w-8"
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
            className="h-8 w-8"
            onClick={toggleTheme}
            aria-label={themeLabel}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </ToolbarTooltip>
      </div>
      <div className="mt-3 space-y-0.5 px-0.5 text-[11px] leading-snug text-muted-foreground">
        <p>Built on project Asgard</p>
        <p>© 2026</p>
      </div>
    </div>
  )
}

function SectionList({
  groups,
  activeSection,
  currentView,
  onSelectSection,
}: {
  groups: PublicOrdstirrRailGroup[]
  activeSection: PublicOrdstirrRailSectionId | null
  currentView: PublicManifestView
  onSelectSection: (sectionId: PublicOrdstirrRailSectionId) => void
}) {
  return (
    <div className="min-h-0 flex-1 overflow-y-auto px-2 py-3">
      {groups.map((group, groupIndex) => (
        <div key={group.id}>
          {groupIndex > 0 ? (
            <div className="my-3 border-t border-border" aria-hidden />
          ) : null}
          <p className="mb-1 px-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
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
                      'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-foreground hover:bg-muted/60',
                      onOtherPage && !active && 'text-muted-foreground',
                    )}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0 opacity-70" aria-hidden />
                    <span className="truncate font-medium">{section.label}</span>
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
        <PublicSidebarBrand name={brandName} />
        <SectionList
          groups={groups}
          activeSection={activeSection}
          currentView={currentView}
          onSelectSection={onSelectSection}
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
      />
    </div>
  )
}

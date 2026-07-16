import { Section } from 'lucide-react'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import type {
  PublicOrdstirrRailGroup,
  PublicOrdstirrRailSectionId,
} from '@/lib/public-ordstirr-rail'
import type { PublicManifestView } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

export function PublicOrdstirrSectionsRail({
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
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <StudioRailTitle icon={Section}>Sections</StudioRailTitle>
      </div>
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
    </div>
  )
}

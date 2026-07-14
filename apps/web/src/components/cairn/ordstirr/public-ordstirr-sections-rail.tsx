import { Section } from 'lucide-react'
import { Badge } from '@/components/core/ui/badge'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import type { PublicOrdstirrRailSection, PublicOrdstirrRailSectionId } from '@/lib/public-ordstirr-rail'
import type { PublicManifestView } from '@/lib/public-manifest-path'
import { cn } from '@/lib/utils'

export function PublicOrdstirrSectionsRail({
  sections,
  activeSection,
  currentView,
  onSelectSection,
}: {
  sections: PublicOrdstirrRailSection[]
  activeSection: PublicOrdstirrRailSectionId | null
  currentView: PublicManifestView
  onSelectSection: (sectionId: PublicOrdstirrRailSectionId) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <StudioRailTitle icon={Section}>Sections</StudioRailTitle>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        <ul className="space-y-1.5">
          {sections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            const onOtherPage = section.view !== currentView
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  className={cn(
                    'flex w-full items-center justify-between gap-2 rounded-lg border bg-card p-2 text-left text-xs transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border hover:border-primary/50',
                    onOtherPage && !active && 'opacity-90',
                  )}
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate text-sm font-medium">{section.label}</span>
                  </span>
                  {section.count !== null && section.count > 0 ? (
                    <Badge variant="secondary" className="shrink-0 text-xs tabular-nums">
                      {section.count}
                    </Badge>
                  ) : null}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}

import type { LucideIcon } from 'lucide-react'
import { Section } from 'lucide-react'
import { StudioRailTitle } from '@/components/core/layout/studio-rail-title'
import { cn } from '@/lib/utils'

export type ThingRailSection = {
  id: string
  label: string
  icon: LucideIcon
}

export function ThingSectionsRail({
  sections,
  activeSection,
  onSelectSection,
}: {
  sections: ThingRailSection[]
  activeSection: string
  onSelectSection: (sectionId: string) => void
}) {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex h-14 min-h-14 max-h-14 shrink-0 items-center border-b border-border px-3">
        <StudioRailTitle icon={Section}>Sections</StudioRailTitle>
      </div>
      <nav className="min-h-0 flex-1 overflow-y-auto p-2" aria-label="Thing settings sections">
        <ul className="space-y-1.5">
          {sections.map((section) => {
            const Icon = section.icon
            const active = activeSection === section.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  onClick={() => onSelectSection(section.id)}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-lg border bg-card p-2 text-left text-sm font-medium transition-colors',
                    active
                      ? 'border-primary/40 bg-primary/10'
                      : 'border-border hover:border-primary/50',
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate">{section.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </nav>
    </div>
  )
}

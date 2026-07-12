import { useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import { Github, Globe, Linkedin, MapPin } from 'lucide-react'
import { Avatar } from '@/components/core/ui/avatar'
import { RichTextContent } from '@/components/core/ui/rich-text-content'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import type { ManifestTerms } from '@/lib/manifest-terminology'
import type { ManifestData, ManifestOrigins } from '@/lib/manifest-api'
import {
  formatManifestDateRange,
  formatManifestMonth,
  type OrdstirrSectionId,
} from '@/lib/ordstirr-format'
import { cn } from '@/lib/utils'
import {
  patchManifestExpedition,
  patchManifestLandmark,
  patchManifestPathfinding,
} from './ordstirr-manifest-patch'
import { OrdstirrGearChart } from './ordstirr-gear-chart'
import { OrdstirrInlineRichText } from './ordstirr-inline-rich-text'
import { isDraftEntryId } from './ordstirr-empty-entries'

function ManifestSection({
  id,
  title,
  registerSection,
  onSectionSelect,
  onAdd,
  children,
}: {
  id: OrdstirrSectionId
  title: string
  registerSection: (id: OrdstirrSectionId, node: HTMLElement | null) => void
  onSectionSelect: (id: OrdstirrSectionId) => void
  onAdd?: () => void
  children: React.ReactNode
}) {
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    registerSection(id, ref.current)
    return () => registerSection(id, null)
  }, [id, registerSection])

  return (
    <section ref={ref} id={`ordstirr-section-${id}`} className="flex scroll-mt-4 flex-col gap-4">
      <div className="flex items-center gap-4">
        <button
          type="button"
          data-inspectable
          onClick={() => onSectionSelect(id)}
          className="shrink-0 text-lg font-semibold transition-colors hover:text-primary"
        >
          {title}
        </button>
        <div className="h-px flex-1 bg-border" />
        {onAdd ? (
          <ToolbarTooltip label={`Add ${title}`}>
            <button
              type="button"
              data-inspectable
              onClick={onAdd}
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted-hover hover:text-foreground"
              aria-label={`Add ${title}`}
            >
              <Plus className="h-4 w-4" />
            </button>
          </ToolbarTooltip>
        ) : null}
      </div>
      {children}
    </section>
  )
}

function SelectableEntry({
  selected,
  onSelect,
  children,
  className,
  isDraft,
}: {
  selected: boolean
  onSelect: () => void
  children: React.ReactNode
  className?: string
  isDraft?: boolean
}) {
  return (
    <div
      className={cn(
        'w-full rounded-lg border p-3 transition-colors',
        selected ? 'border-primary bg-primary/5' : 'border-border',
        isDraft && 'border-dashed border-primary/40',
        className,
      )}
    >
      <button type="button" data-inspectable onClick={onSelect} className="w-full text-left">
        {children}
      </button>
    </div>
  )
}

function ContactLinks({ origins }: { origins: ManifestOrigins | null }) {
  if (!origins) return null
  const links = [
    origins.location
      ? { key: 'location', icon: MapPin, label: origins.location, href: null as string | null }
      : null,
    origins.website
      ? { key: 'website', icon: Globe, label: 'Website', href: origins.website }
      : null,
    origins.linkedin
      ? { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', href: origins.linkedin }
      : null,
    origins.github
      ? { key: 'github', icon: Github, label: 'GitHub', href: origins.github }
      : null,
  ].filter(Boolean) as Array<{
    key: string
    icon: typeof MapPin
    label: string
    href: string | null
  }>

  if (links.length === 0) return null

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
      {links.map((link) => {
        const Icon = link.icon
        const content = (
          <span className="inline-flex items-center gap-1.5">
            <Icon className="h-3.5 w-3.5" />
            {link.label}
          </span>
        )
        return link.href ? (
          <a
            key={link.key}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground"
            onClick={(event) => event.stopPropagation()}
          >
            {content}
          </a>
        ) : (
          <span key={link.key}>{content}</span>
        )
      })}
    </div>
  )
}

export function OrdstirrCanvas({
  data,
  terms,
  selectedEntryId,
  registerSection,
  onOriginsChange,
  onSelectEntry,
  onSectionSelect,
  onAddEntry,
  onOpenJourney,
  setDraft,
}: {
  data: ManifestData
  terms: ManifestTerms
  selectedEntryId: string | null
  registerSection: (id: OrdstirrSectionId, node: HTMLElement | null) => void
  onOriginsChange: (origins: ManifestOrigins) => void
  onSelectEntry: (sectionId: OrdstirrSectionId, entryId: string) => void
  onSectionSelect: (sectionId: OrdstirrSectionId) => void
  onAddEntry: (sectionId: OrdstirrSectionId) => void
  onOpenJourney: () => void
  setDraft: React.Dispatch<React.SetStateAction<ManifestData | null>>
}) {
  const origins = data.origins ?? {
    headline: null,
    summary: null,
    bio: null,
    location: null,
    website: null,
    linkedin: null,
    github: null,
  }

  const displayName = data.user.name ?? data.user.email ?? 'Your name'
  const initials = displayName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const groupedGear = data.gear.reduce<Record<string, typeof data.gear>>((acc, item) => {
    const key = item.category ?? 'Other'
    if (!acc[key]) acc[key] = []
    acc[key].push(item)
    return acc
  }, {})

  function patchOrigins(patch: Partial<ManifestOrigins>) {
    onOriginsChange({ ...origins, ...patch })
  }

  return (
    <div className="h-full overflow-y-auto bg-background">
      <div className="mx-auto flex max-w-3xl flex-col gap-12 px-6 py-8">
        <ManifestSection
          id="origins"
          title={terms.origins}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
        >
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
              <Avatar src={data.user.image} alt={displayName} fallback={initials} className="h-20 w-20" />
              <div className="min-w-0 flex-1">
                <h1 className="text-2xl font-semibold">{displayName}</h1>
                <input
                  type="text"
                  value={origins.headline ?? ''}
                  onChange={(event) => patchOrigins({ headline: event.target.value || null })}
                  placeholder={terms.headline}
                  className="mt-1 w-full bg-transparent text-muted-foreground outline-none placeholder:text-muted-foreground/50"
                />
              </div>
            </div>
            <ContactLinks origins={origins} />
            <OrdstirrInlineRichText
              value={origins.summary ?? ''}
              onChange={(html) => patchOrigins({ summary: html || null })}
              placeholder={`Write a ${terms.summary.toLowerCase()}…`}
              minHeightClassName="min-h-[120px]"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onOpenJourney}
                className="rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/50"
              >
                {terms.bio_button}
              </button>
            </div>
          </div>
        </ManifestSection>

        <ManifestSection
          id="expeditions"
          title={terms.expeditions}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('expeditions')}
        >
          {data.expeditions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.expeditions.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.expeditions.map((exp) => {
                const isDraft = isDraftEntryId(exp.id)
                return (
                <div key={exp.id}>
                  <SelectableEntry
                    selected={selectedEntryId === exp.id}
                    onSelect={() => onSelectEntry('expeditions', exp.id)}
                    isDraft={isDraft}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn('font-medium', isDraft && !exp.title && 'italic text-muted-foreground')}>
                            {exp.title || (isDraft ? `New ${terms.expeditions}` : 'Untitled')}
                          </p>
                          <p className={cn('text-sm text-muted-foreground', isDraft && !exp.company && 'italic opacity-70')}>
                            {exp.company || (isDraft ? 'Company' : '')}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatManifestDateRange(exp.startDate, exp.endDate, exp.current)}
                        </span>
                      </div>
                    </div>
                  </SelectableEntry>
                  <OrdstirrInlineRichText
                    value={exp.description ?? ''}
                    onChange={(html) =>
                      patchManifestExpedition(setDraft, exp.id, { description: html || null })
                    }
                    placeholder={`Describe this ${terms.expeditions.toLowerCase()} entry…`}
                    className="mt-2 px-1"
                  />
                </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="training"
          title={terms.training}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('training')}
        >
          {data.training.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.training.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.training.map((entry) => {
                const isDraft = isDraftEntryId(entry.id)
                return (
                <div key={entry.id}>
                  <SelectableEntry
                    selected={selectedEntryId === entry.id}
                    onSelect={() => onSelectEntry('training', entry.id)}
                    isDraft={isDraft}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn('font-medium', isDraft && !entry.institution && 'italic text-muted-foreground')}>
                            {entry.institution || (isDraft ? `New ${terms.training}` : 'Untitled')}
                          </p>
                          {entry.degree ? (
                            <p className="text-sm text-muted-foreground">{entry.degree}</p>
                          ) : isDraft ? (
                            <p className="text-sm italic text-muted-foreground/70">Degree or program</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatManifestDateRange(entry.startDate, entry.endDate, entry.current)}
                        </span>
                      </div>
                      {entry.description ? (
                        <RichTextContent
                          html={entry.description}
                          className="mt-2 text-sm text-muted-foreground"
                        />
                      ) : isDraft ? (
                        <p className="mt-2 text-sm italic text-muted-foreground/50">Add notes in the inspector…</p>
                      ) : null}
                    </div>
                  </SelectableEntry>
                </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="gear"
          title={terms.gear}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('gear')}
        >
          {data.gear.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.gear.toLowerCase()} yet.</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {Object.entries(groupedGear).map(([category, items]) => {
                const hasLevels = items.some((item) => item.level)
                if (hasLevels) {
                  return (
                    <OrdstirrGearChart
                      key={category}
                      category={category}
                      items={items}
                      selectedEntryId={selectedEntryId}
                      onSelectItem={(id) => onSelectEntry('gear', id)}
                    />
                  )
                }
                return (
                  <div key={category} className="flex flex-col gap-2 rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{category}</p>
                    <ul className="m-0 list-none space-y-1 p-0 text-sm text-muted-foreground">
                      {items.map((item) => (
                        <li key={item.id}>
                          <button
                            type="button"
                            data-inspectable
                            onClick={() => onSelectEntry('gear', item.id)}
                            className={cn(
                              'text-left hover:text-foreground',
                              selectedEntryId === item.id && 'font-medium text-foreground',
                            )}
                          >
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="landmarks"
          title={terms.landmarks}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('landmarks')}
        >
          {data.landmarks.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.landmarks.toLowerCase()} yet.</p>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {data.landmarks.map((landmark) => (
                <div key={landmark.id}>
                  <SelectableEntry
                    selected={selectedEntryId === landmark.id}
                    onSelect={() => onSelectEntry('landmarks', landmark.id)}
                    className="bg-secondary p-4"
                  >
                    <p className="font-medium">{landmark.name}</p>
                  </SelectableEntry>
                  <OrdstirrInlineRichText
                    value={landmark.description ?? ''}
                    onChange={(html) =>
                      patchManifestLandmark(setDraft, landmark.id, { description: html || null })
                    }
                    placeholder={`Describe this ${terms.landmarks.toLowerCase()} entry…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="summits"
          title={terms.summits}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('summits')}
        >
          {data.summits.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.summits.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.summits.map((summit) => {
                const isDraft = isDraftEntryId(summit.id)
                return (
                <div key={summit.id}>
                  <SelectableEntry
                    selected={selectedEntryId === summit.id}
                    onSelect={() => onSelectEntry('summits', summit.id)}
                    isDraft={isDraft}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={cn('font-medium', isDraft && !summit.title && 'italic text-muted-foreground')}>
                            {summit.title || (isDraft ? `New ${terms.summits}` : 'Untitled')}
                          </p>
                          {summit.issuer ? (
                            <p className="text-sm text-muted-foreground">{summit.issuer}</p>
                          ) : isDraft ? (
                            <p className="text-sm italic text-muted-foreground/70">Issuer</p>
                          ) : null}
                        </div>
                        {summit.date ? (
                          <span className="shrink-0 text-sm text-muted-foreground">
                            {formatManifestMonth(summit.date)}
                          </span>
                        ) : null}
                      </div>
                      {summit.description ? (
                        <RichTextContent
                          html={summit.description}
                          className="mt-2 text-sm text-muted-foreground"
                        />
                      ) : isDraft ? (
                        <p className="mt-2 text-sm italic text-muted-foreground/50">Add notes in the inspector…</p>
                      ) : null}
                    </div>
                  </SelectableEntry>
                </div>
                )
              })}
            </div>
          )}
        </ManifestSection>

        <ManifestSection
          id="pathfinding"
          title={terms.pathfinding}
          registerSection={registerSection}
          onSectionSelect={onSectionSelect}
          onAdd={() => onAddEntry('pathfinding')}
        >
          {data.pathfinding.length === 0 ? (
            <p className="text-sm text-muted-foreground">No {terms.pathfinding.toLowerCase()} yet.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {data.pathfinding.map((entry) => (
                <div key={entry.id}>
                  <SelectableEntry
                    selected={selectedEntryId === entry.id}
                    onSelect={() => onSelectEntry('pathfinding', entry.id)}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="font-medium">{entry.organization}</p>
                          {entry.role ? (
                            <p className="text-sm text-muted-foreground">{entry.role}</p>
                          ) : null}
                        </div>
                        <span className="shrink-0 text-sm text-muted-foreground">
                          {formatManifestDateRange(entry.startDate, entry.endDate, entry.current)}
                        </span>
                      </div>
                    </div>
                  </SelectableEntry>
                  <OrdstirrInlineRichText
                    value={entry.description ?? ''}
                    onChange={(html) =>
                      patchManifestPathfinding(setDraft, entry.id, { description: html || null })
                    }
                    placeholder={`Describe this ${terms.pathfinding.toLowerCase()} entry…`}
                    className="mt-2 px-1"
                  />
                </div>
              ))}
            </div>
          )}
        </ManifestSection>
      </div>
    </div>
  )
}

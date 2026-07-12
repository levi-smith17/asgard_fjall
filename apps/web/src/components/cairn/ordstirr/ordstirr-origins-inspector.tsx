import { Input } from '@/components/core/ui/input'
import { InspectorChrome, InspectorChromeTitle } from '@/components/core/ui/inspector-chrome'
import { useTerminology } from '@/hooks/use-terminology'
import { getManifestTerms } from '@/lib/manifest-terminology'
import type { ManifestOrigins } from '@/lib/manifest-api'

export function OrdstirrOriginsInspector({
  origins,
  onChange,
}: {
  origins: ManifestOrigins
  onChange: (origins: ManifestOrigins) => void
}) {
  const { terminology } = useTerminology()
  const terms = getManifestTerms(terminology)

  function patch(patch: Partial<ManifestOrigins>) {
    onChange({ ...origins, ...patch })
  }

  return (
    <div className="flex h-full flex-col">
      <InspectorChrome>
        <InspectorChromeTitle eyebrow={terms.origins} title="Contact & links" />
      </InspectorChrome>

      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
        <p className="text-xs text-muted-foreground">
          {terms.summary} and {terms.bio.toLowerCase()} edits live on the canvas. These fields update
          the header area.
        </p>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">{terms.location}</span>
          <Input
            value={origins.location ?? ''}
            onChange={(event) => patch({ location: event.target.value || null })}
            placeholder="City, region"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Website</span>
          <Input
            value={origins.website ?? ''}
            onChange={(event) => patch({ website: event.target.value || null })}
            placeholder="https://…"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">LinkedIn</span>
          <Input
            value={origins.linkedin ?? ''}
            onChange={(event) => patch({ linkedin: event.target.value || null })}
            placeholder="https://linkedin.com/in/…"
          />
        </label>
        <label className="block space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">GitHub</span>
          <Input
            value={origins.github ?? ''}
            onChange={(event) => patch({ github: event.target.value || null })}
            placeholder="https://github.com/…"
          />
        </label>
      </div>
    </div>
  )
}

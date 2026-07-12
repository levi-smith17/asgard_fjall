import { ContextTabButton } from '@/components/core/ui/context-tab'
import type { ManifestTerms } from '@/lib/manifest-terminology'
import type { OrdstirrCanvasView } from '@/lib/ordstirr-format'

export function OrdstirrPageTabs({
  canvasView,
  terms,
  onCanvasViewChange,
}: {
  canvasView: OrdstirrCanvasView
  terms: ManifestTerms
  onCanvasViewChange: (view: OrdstirrCanvasView) => void
}) {
  const tabs: Array<{ id: OrdstirrCanvasView; label: string }> = [
    { id: 'manifest', label: terms.manifest },
    { id: 'journey', label: terms.bio_button },
  ]

  return (
    <nav
      className="flex h-full min-w-0 items-stretch justify-center gap-0.5 px-1 lg:px-0"
      aria-label="Manifest views"
    >
      {tabs.map((tab) => {
        const active = tab.id === canvasView
        return (
          <ContextTabButton
            key={tab.id}
            type="button"
            active={active}
            aria-current={active ? 'page' : undefined}
            onClick={() => onCanvasViewChange(tab.id)}
          >
            {tab.label}
          </ContextTabButton>
        )
      })}
    </nav>
  )
}

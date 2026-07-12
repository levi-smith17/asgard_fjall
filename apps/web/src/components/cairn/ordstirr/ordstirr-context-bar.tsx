import { Loader2, Save } from 'lucide-react'
import { GlobalSearchTrigger } from '@/components/core/command-palette/global-search-trigger'
import { Button } from '@/components/core/ui/button'
import { ContextBarPinAndSync } from '@/components/core/ui/context-bar-pin-and-sync'
import { StudioContextBar } from '@/components/core/layout/studio-context-bar'
import { ToolbarTooltip } from '@/components/core/ui/toolbar-tooltip'
import { useTerminology } from '@/hooks/use-terminology'
import type { ManifestTerms } from '@/lib/manifest-terminology'
import type { OrdstirrCanvasView } from '@/lib/ordstirr-format'
import { OrdstirrPageTabs } from './ordstirr-page-tabs'

export function OrdstirrContextBar({
  canvasView,
  terms,
  onCanvasViewChange,
  inspectorPinned,
  onInspectorPinnedChange,
  isDirty,
  saving,
  onSave,
}: {
  publicUrl?: string | null
  publicJourneyUrl?: string | null
  canvasView: OrdstirrCanvasView
  terms: ManifestTerms
  onCanvasViewChange: (view: OrdstirrCanvasView) => void
  inspectorPinned: boolean
  onInspectorPinnedChange: (pinned: boolean) => void
  isDirty: boolean
  saving: boolean
  onSave: () => void
}) {
  const { terms: appTerms } = useTerminology()

  return (
    <StudioContextBar
      aria-label={`${appTerms.resume} context`}
      title={appTerms.resume}
      subtitle="Public manifest and live editor"
      tabs={
        <OrdstirrPageTabs
          canvasView={canvasView}
          terms={terms}
          onCanvasViewChange={onCanvasViewChange}
        />
      }
      actions={
        <>
          <GlobalSearchTrigger />
          <ContextBarPinAndSync
            pinned={inspectorPinned}
            onPinnedChange={onInspectorPinnedChange}
          />
          <ToolbarTooltip label="Save (⌘S)">
            <Button
              type="button"
              variant="default"
              className="relative h-9 gap-1.5 px-2.5 shadow-sm sm:px-4"
              onClick={onSave}
              disabled={saving || !isDirty}
              aria-label="Save"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4 shrink-0" />
              )}
              <span className="hidden sm:inline">Save</span>
              {isDirty && !saving ? (
                <span
                  className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-primary-foreground"
                  aria-hidden
                />
              ) : null}
            </Button>
          </ToolbarTooltip>
        </>
      }
    />
  )
}

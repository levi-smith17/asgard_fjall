import { useMemo, useCallback, useState, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { StudioDataToolbar } from '@/components/core/layout/studio-data-toolbar'
import { FilterInput } from '@/components/core/ui/filter-input'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { extractCairnId } from '@/lib/cairn-format'
import { updateNidjatalKin } from '@/lib/nidjatal-api'
import { useTerms } from '@/hooks/use-terminology'
import type { NidjatalKin } from '@/lib/nidjatal-types'
import type { NidjatalParentUpdate } from './nidjatal-kin-node'
import { NidjatalCanvas } from './nidjatal-canvas'
import { NidjatalContextBar } from './nidjatal-context-bar'
import { NidjatalKinForm } from './nidjatal-kin-form'

export type NidjatalPanelState =
  | { mode: 'closed' }
  | { mode: 'kin-form'; kinId: string | null }

interface NidjatalClientProps {
  kins: NidjatalKin[]
  seedKinId: string | null
  onRefresh: () => void
  panel: NidjatalPanelState
  onSetPanel: (panel: NidjatalPanelState) => void
}

export function NidjatalClient({ kins, seedKinId, onRefresh, panel, onSetPanel }: NidjatalClientProps) {
  const terms = useTerms()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [searchQuery, setSearchQuery] = useState('')

  const kinsWithId = useMemo(() => kins.map((k) => ({ ...k, id: extractCairnId(k.sk) })), [kins])

  const selectedKinId = panel.mode === 'kin-form' ? panel.kinId : null
  const inspectorOpen = inspectorPinned || panel.mode !== 'closed'
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  function closePanel() {
    onSetPanel({ mode: 'closed' })
  }

  function openNew() {
    onSetPanel({ mode: 'kin-form', kinId: null })
  }

  const activeKin =
    panel.mode === 'kin-form' && panel.kinId ? kinsWithId.find((k) => k.id === panel.kinId) : undefined

  const isSeed = panel.mode === 'kin-form' && panel.kinId === seedKinId

  const handleQuickParentFix = useCallback(
    async (kinId: string, update: NidjatalParentUpdate) => {
      const kin = kinsWithId.find((k) => k.id === kinId)
      if (!kin) return
      await updateNidjatalKin(kinId, {
        givenName: kin.givenName,
        middleName: kin.middleName,
        nickname: kin.nickname,
        surname: kin.surname,
        birthDate: kin.birthDate,
        deathDate: kin.deathDate,
        fatherId: update.fatherId,
        fatherUnknown: update.fatherUnknown,
        motherId: update.motherId,
        motherUnknown: update.motherUnknown,
        bloodlines: kin.bloodlines,
      })
      onRefresh()
    },
    [kinsWithId, onRefresh],
  )

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && panel.mode !== 'closed') {
        closePanel()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, panel.mode])

  return (
    <ReactFlowProvider>
      <StudioLayout
        railLabel={terms.nidjatalPersonPlural}
        contextBar={
          <NidjatalContextBar
            personCount={kinsWithId.length}
            inspectorPinned={inspectorPinned}
            onInspectorPinnedChange={setInspectorPinned}
            onAddPerson={openNew}
          />
        }
        canvas={
          <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
            <StudioDataToolbar
              trailing={
                <FilterInput
                  value={searchQuery}
                  onChange={setSearchQuery}
                  placeholder={`Filter ${terms.nidjatalPersonPlural.toLowerCase()}…`}
                  className="w-full max-w-xs"
                />
              }
            />
            <div className="min-h-0 flex-1 overflow-hidden" data-inspectable>
              <NidjatalCanvas
                kins={kinsWithId}
                selectedKinId={selectedKinId}
                searchQuery={searchQuery}
                onKinClick={(id) => onSetPanel({ mode: 'kin-form', kinId: id })}
                onQuickParentFix={handleQuickParentFix}
                onPaneClick={() => {
                  if (!inspectorPinned) closePanel()
                }}
              />
            </div>
          </div>
        }
        inspectorState={inspectorState}
        inspectorHint={`Select a ${terms.nidjatalPerson.toLowerCase()} to edit, or add a new one`}
        inspector={
          panel.mode === 'kin-form' ? (
            <NidjatalKinForm
              key={panel.kinId ?? 'new'}
              kin={activeKin}
              isNew={Boolean(isSeed)}
              isSeed={isSeed}
              allKin={kinsWithId}
              onDone={closePanel}
              onRefresh={onRefresh}
            />
          ) : inspectorPinned ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Inspector</p>
              </div>
              <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
                Select a {terms.nidjatalPerson.toLowerCase()} to edit, or add a new one from the toolbar.
              </p>
            </div>
          ) : null
        }
      />
    </ReactFlowProvider>
  )
}

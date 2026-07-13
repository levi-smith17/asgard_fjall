import { useState, useMemo, useCallback, useEffect } from 'react'
import { ReactFlowProvider } from 'reactflow'
import { toast } from 'sonner'
import type { SfOutpost, SfNetwork, SfResource } from '@/lib/starfield-types'
import { validateNetwork } from '@/lib/starfield-validation'
import {
  createNetwork, updateNetwork, deleteNetwork,
  createSystem, updateSystem, deleteSystem,
  addPlanet, updatePlanet, deletePlanet,
} from '@/lib/cairn-starfield-api'
import { starfieldSlug } from '@/lib/starfield-slug'
import { StarfieldCanvas } from './starfield-canvas'
import { ResourcesPanel } from './resources-panel'
import { SystemsPanel } from './systems-panel'
import { OutpostForm } from './outpost-form'
import { OutpostResourceForm } from './outpost-resource-form'
import { NetworkInspector } from './network-inspector'

type RightPanelState =
  | { mode: 'closed' }
  | { mode: 'resources' }
  | { mode: 'systems' }
  | { mode: 'network-form'; networkId: string | null }
  | { mode: 'outpost-form'; outpostId: string | null }
  | { mode: 'outpost-resource'; outpostId: string; resourceId: string | null }

export type StarfieldInspectorMode = RightPanelState

interface SystemEntry {
  id: string
  name: string
  planets: { id: string; name: string }[]
}

function mapSystemFromApi(s: { sk?: string; id?: string; name?: string; planets?: { id?: string; name?: string }[] }): SystemEntry {
  return {
    id: s.sk?.replace(/^SYSTEM#/, '') ?? s.id ?? '',
    name: (s.name ?? '').trim() || 'Unnamed system',
    planets: (s.planets ?? []).map(p => ({
      id: p.id ?? starfieldSlug((p.name ?? '').trim() || 'planet'),
      name: (p.name ?? '').trim() || 'Unnamed planet',
    })),
  }
}

interface StarfieldClientProps {
  networks: SfNetwork[]
  outposts: (SfOutpost & { id: string })[]
  resources: SfResource[]
  resourceTypes: any[]
  systems: any[]
  onRefresh: () => void
  selectedNetworkId: string | null
  onSelectedNetworkIdChange: (id: string | null) => void
  inspectorMode: RightPanelState
  onInspectorModeChange: (panel: RightPanelState) => void
  filterQuery?: string
  canvasOnly?: boolean
  onRegisterInspector?: (inspector: React.ReactNode) => void
}

export function StarfieldClient({
  networks,
  outposts,
  resources,
  systems: systemsProp,
  onRefresh,
  selectedNetworkId,
  onSelectedNetworkIdChange,
  inspectorMode,
  onInspectorModeChange,
  filterQuery = '',
  canvasOnly = false,
  onRegisterInspector,
}: StarfieldClientProps) {
  const rightPanel = inspectorMode
  const setRightPanel = onInspectorModeChange

  // Global systems state — initialized from API data, updated optimistically
  const [localSystems, setLocalSystems] = useState<SystemEntry[]>(() =>
    (systemsProp ?? []).map(mapSystemFromApi)
  )

  useEffect(() => {
    setLocalSystems((systemsProp ?? []).map(mapSystemFromApi))
  }, [systemsProp])

  const networkOutposts = useMemo(
    () => outposts.filter(o => o.networkId === selectedNetworkId),
    [outposts, selectedNetworkId]
  )

  const validations = useMemo(
    () => validateNetwork(networkOutposts, resources),
    [networkOutposts, resources]
  )

  const showRightPanel = !canvasOnly && rightPanel.mode !== 'closed'

  const closePanel = useCallback(() => {
    setRightPanel({ mode: 'closed' })
  }, [setRightPanel])

  // ── Network CRUD ─────────────────────────────────────────────────────────────

  async function handleCreateNetwork(name: string, abbreviation: string) {
    try {
      await createNetwork({ name, abbreviation })
      onRefresh()
      toast.success(`Network "${name}" created.`)
    } catch {
      toast.error('Failed to create network.')
    }
  }

  async function handleUpdateNetwork(id: string, name: string, abbreviation: string) {
    try {
      await updateNetwork(id, { name, abbreviation })
      onRefresh()
      toast.success('Network updated.')
    } catch {
      toast.error('Failed to update network.')
    }
  }

  async function handleDeleteNetwork(id: string) {
    try {
      await deleteNetwork(id)
      if (selectedNetworkId === id) {
        onSelectedNetworkIdChange(
          networks.find(n => n.sk.replace(/^SF#NETWORK#/, '') !== id)?.sk.replace(/^SF#NETWORK#/, '') ?? null
        )
      }
      onRefresh()
      toast.success('Network removed.')
    } catch {
      toast.error('Failed to remove network.')
    }
  }

  // ── System CRUD (optimistic local update + background API) ───────────────────

  const handleSystemCreate = useCallback((name: string) => {
    const id = starfieldSlug(name)
    setLocalSystems(prev => {
      if (prev.some(s => s.id === id || s.name.toLowerCase() === name.toLowerCase())) return prev
      return [...prev, { id, name, planets: [] }]
    })
    toast.success('System created.')
    createSystem(name).catch(() => toast.error('Failed to save system.'))
  }, [])

  const handleSystemRename = useCallback((id: string, newName: string) => {
    setLocalSystems(prev => prev.map(s => s.id === id ? { ...s, name: newName } : s))
    toast.success('System renamed.')
    updateSystem(id, newName).catch(() => toast.error('Failed to update system.'))
  }, [])

  const handleSystemDelete = useCallback((id: string) => {
    setLocalSystems(prev => prev.filter(s => s.id !== id))
    toast.success('System removed.')
    deleteSystem(id).catch(() => toast.error('Failed to remove system.'))
  }, [])

  const handlePlanetCreate = useCallback((systemId: string, name: string) => {
    const id = starfieldSlug(name)
    setLocalSystems(prev => prev.map(s => {
      if (s.id !== systemId) return s
      if (s.planets.some(p => p.id === id || p.name.toLowerCase() === name.toLowerCase())) return s
      return { ...s, planets: [...s.planets, { id, name }] }
    }))
    toast.success('Planet added.')
    addPlanet(systemId, name).catch(() => toast.error('Failed to save planet.'))
  }, [])

  const handlePlanetRename = useCallback((systemId: string, planetId: string, newName: string) => {
    setLocalSystems(prev => prev.map(s =>
      s.id === systemId
        ? { ...s, planets: s.planets.map(p => p.id === planetId ? { id: starfieldSlug(newName), name: newName } : p) }
        : s
    ))
    toast.success('Planet renamed.')
    updatePlanet(systemId, planetId, newName).catch(() => toast.error('Failed to update planet.'))
  }, [])

  const handlePlanetDelete = useCallback((systemId: string, planetId: string) => {
    setLocalSystems(prev => prev.map(s =>
      s.id === systemId ? { ...s, planets: s.planets.filter(p => p.id !== planetId) } : s
    ))
    toast.success('Planet removed.')
    deletePlanet(systemId, planetId).catch(() => toast.error('Failed to remove planet.'))
  }, [])

  const systemCrudCallbacks = useMemo(() => ({
    onSystemCreate: handleSystemCreate,
    onSystemRename: handleSystemRename,
    onSystemDelete: handleSystemDelete,
    onPlanetCreate: handlePlanetCreate,
    onPlanetRename: handlePlanetRename,
    onPlanetDelete: handlePlanetDelete,
  }), [handleSystemCreate, handleSystemRename, handleSystemDelete, handlePlanetCreate, handlePlanetRename, handlePlanetDelete])

  const selectedOutpostId =
    rightPanel.mode === 'outpost-form' || rightPanel.mode === 'outpost-resource'
      ? rightPanel.outpostId
      : null

  const inspectorPanels = useMemo(
    () => (
      <StarfieldInspectorPanels
        rightPanel={rightPanel}
        closePanel={closePanel}
        resources={resources}
        localSystems={localSystems}
        networkOutposts={networkOutposts}
        networks={networks}
        selectedNetworkId={selectedNetworkId}
        systemCrudCallbacks={systemCrudCallbacks}
        onRefresh={onRefresh}
        onSystemCreate={handleSystemCreate}
        onSystemRename={handleSystemRename}
        onSystemDelete={handleSystemDelete}
        onPlanetCreate={handlePlanetCreate}
        onPlanetRename={handlePlanetRename}
        onPlanetDelete={handlePlanetDelete}
        onCreateNetwork={handleCreateNetwork}
        onUpdateNetwork={handleUpdateNetwork}
        onDeleteNetwork={handleDeleteNetwork}
      />
    ),
    [
      rightPanel,
      closePanel,
      resources,
      localSystems,
      networkOutposts,
      networks,
      selectedNetworkId,
      systemCrudCallbacks,
      onRefresh,
      handleSystemCreate,
      handleSystemRename,
      handleSystemDelete,
      handlePlanetCreate,
      handlePlanetRename,
      handlePlanetDelete,
    ],
  )

  useEffect(() => {
    if (!canvasOnly || !onRegisterInspector) return
    onRegisterInspector(rightPanel.mode === 'closed' ? null : inspectorPanels)
  }, [canvasOnly, onRegisterInspector, rightPanel.mode, inspectorPanels])

  return (
    <ReactFlowProvider>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <div className="flex min-h-0 flex-1 overflow-hidden">
            <StarfieldCanvas
              outposts={networkOutposts}
              resources={resources}
              validations={validations}
              selectedOutpostId={selectedOutpostId}
              filterQuery={filterQuery}
              onOutpostClick={(id) => setRightPanel({ mode: 'outpost-form', outpostId: id })}
              onAddOutpostResource={(id) =>
                setRightPanel({ mode: 'outpost-resource', outpostId: id, resourceId: null })
              }
              onEditOutpostResource={(outpostId, resourceId) =>
                setRightPanel({ mode: 'outpost-resource', outpostId, resourceId })
              }
            />
          </div>

          {showRightPanel ? (
            <div className="flex w-full shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card md:w-[420px]">
              {inspectorPanels}
            </div>
          ) : null}
        </div>
      </div>
    </ReactFlowProvider>
  )
}

export function StarfieldInspectorPanels({
  rightPanel,
  closePanel,
  resources,
  localSystems,
  networkOutposts,
  networks,
  selectedNetworkId,
  systemCrudCallbacks,
  onRefresh,
  onSystemCreate,
  onSystemRename,
  onSystemDelete,
  onPlanetCreate,
  onPlanetRename,
  onPlanetDelete,
  onCreateNetwork,
  onUpdateNetwork,
  onDeleteNetwork,
}: {
  rightPanel: RightPanelState
  closePanel: () => void
  resources: SfResource[]
  localSystems: SystemEntry[]
  networkOutposts: (SfOutpost & { id: string })[]
  networks: SfNetwork[]
  selectedNetworkId: string | null
  systemCrudCallbacks: {
    onSystemCreate: (name: string) => void
    onSystemRename: (id: string, newName: string) => void
    onSystemDelete: (id: string) => void
    onPlanetCreate: (systemId: string, name: string) => void
    onPlanetRename: (systemId: string, planetId: string, newName: string) => void
    onPlanetDelete: (systemId: string, planetId: string) => void
  }
  onRefresh: () => void
  onSystemCreate: (name: string) => void
  onSystemRename: (id: string, newName: string) => void
  onSystemDelete: (id: string) => void
  onPlanetCreate: (systemId: string, name: string) => void
  onPlanetRename: (systemId: string, planetId: string, newName: string) => void
  onPlanetDelete: (systemId: string, planetId: string) => void
  onCreateNetwork: (name: string, abbreviation: string) => Promise<void>
  onUpdateNetwork: (id: string, name: string, abbreviation: string) => Promise<void>
  onDeleteNetwork: (id: string) => Promise<void>
}) {
  if (rightPanel.mode === 'closed') return null

  const editingNetwork =
    rightPanel.mode === 'network-form' && rightPanel.networkId
      ? networks.find((n) => n.sk.replace(/^SF#NETWORK#/, '') === rightPanel.networkId)
      : undefined

  return (
    <>
      {rightPanel.mode === 'network-form' ? (
        <NetworkInspector
          key={rightPanel.networkId ?? 'new'}
          network={
            editingNetwork
              ? {
                  id: editingNetwork.sk.replace(/^SF#NETWORK#/, ''),
                  name: editingNetwork.name,
                  abbreviation: editingNetwork.abbreviation,
                }
              : undefined
          }
          onSave={async (name, abbreviation) => {
            if (rightPanel.networkId) {
              await onUpdateNetwork(rightPanel.networkId, name, abbreviation)
            } else {
              await onCreateNetwork(name, abbreviation)
            }
            closePanel()
          }}
          onDelete={
            rightPanel.networkId
              ? async () => {
                  await onDeleteNetwork(rightPanel.networkId!)
                  closePanel()
                }
              : undefined
          }
        />
      ) : null}

      {rightPanel.mode === 'resources' && (
        <ResourcesPanel resources={resources} onClose={closePanel} onRefresh={onRefresh} />
      )}

      {rightPanel.mode === 'systems' && (
        <SystemsPanel
          systems={localSystems}
          onClose={closePanel}
          onSystemCreate={onSystemCreate}
          onSystemRename={onSystemRename}
          onSystemDelete={onSystemDelete}
          onPlanetCreate={onPlanetCreate}
          onPlanetRename={onPlanetRename}
          onPlanetDelete={onPlanetDelete}
        />
      )}

      {rightPanel.mode === 'outpost-form' && (
        <OutpostForm
          key={rightPanel.outpostId ?? 'new'}
          outpost={networkOutposts.find((o) => o.id === rightPanel.outpostId) ?? undefined}
          networkId={selectedNetworkId ?? ''}
          outposts={networkOutposts}
          systems={localSystems}
          systemCrudCallbacks={systemCrudCallbacks}
          onDone={closePanel}
          onRefresh={onRefresh}
        />
      )}

      {rightPanel.mode === 'outpost-resource' && (
        <div className="flex h-full flex-col">
          <OutpostResourceForm
            key={`${rightPanel.outpostId}-${rightPanel.resourceId ?? 'new'}`}
            outpostId={rightPanel.outpostId}
            resourceId={rightPanel.resourceId}
            resources={resources}
            outposts={networkOutposts}
            systems={localSystems}
            systemCrudCallbacks={systemCrudCallbacks}
            onDone={closePanel}
            onRefresh={onRefresh}
          />
        </div>
      )}
    </>
  )
}

export function useStarfieldNetworkHandlers({
  networks,
  selectedNetworkId,
  onSelectedNetworkIdChange,
  onRefresh,
}: {
  networks: SfNetwork[]
  selectedNetworkId: string | null
  onSelectedNetworkIdChange: (id: string | null) => void
  onRefresh: () => void
}) {
  async function handleCreateNetwork(name: string, abbreviation: string) {
    try {
      await createNetwork({ name, abbreviation })
      onRefresh()
      toast.success(`Network "${name}" created.`)
    } catch {
      toast.error('Failed to create network.')
    }
  }

  async function handleUpdateNetwork(id: string, name: string, abbreviation: string) {
    try {
      await updateNetwork(id, { name, abbreviation })
      onRefresh()
      toast.success('Network updated.')
    } catch {
      toast.error('Failed to update network.')
    }
  }

  async function handleDeleteNetwork(id: string) {
    try {
      await deleteNetwork(id)
      if (selectedNetworkId === id) {
        onSelectedNetworkIdChange(
          networks.find((n) => n.sk.replace(/^SF#NETWORK#/, '') !== id)?.sk.replace(/^SF#NETWORK#/, '') ??
            null,
        )
      }
      onRefresh()
      toast.success('Network removed.')
    } catch {
      toast.error('Failed to remove network.')
    }
  }

  return { handleCreateNetwork, handleUpdateNetwork, handleDeleteNetwork }
}

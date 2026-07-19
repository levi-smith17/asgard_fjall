import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { StudioCanvasSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { InspectorEmptyState } from '@/components/core/ui/inspector-chrome'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import {
  StjornurClient,
  type StjornurInspectorMode,
} from '@/components/apps/stjornur/stjornur-client'
import { StjornurControlBar } from '@/components/apps/stjornur/stjornur-control-bar'
import { StjornurContextBar } from '@/components/apps/stjornur/stjornur-context-bar'
import { StjornurNetworksRail } from '@/components/apps/stjornur/stjornur-networks-rail'
import { TooltipProvider } from '@/components/core/ui/tooltip'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { fetchFjallStatus } from '@/lib/data-api'
import { fetchStjornurData } from '@/lib/stjornur-api'

function networkIdFromSk(sk: string): string {
  return sk.replace(/^SF#NETWORK#/, '')
}

export function StjornurPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [inspectorMode, setInspectorMode] = useState<StjornurInspectorMode>({ mode: 'closed' })
  const [inspectorContent, setInspectorContent] = useState<React.ReactNode>(null)
  const [filterQuery, setFilterQuery] = useState('')

  const selectedNetworkId = searchParams.get('network')

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const stjornurQuery = useQuery({
    queryKey: ['stjornur'],
    queryFn: fetchStjornurData,
    enabled: statusQuery.data?.configured === true,
  })

  const configured = statusQuery.data?.configured === true
  const loading = statusQuery.isLoading || (configured && stjornurQuery.isLoading)
  const data = stjornurQuery.data

  const networks = data?.networks ?? []
  const outposts = data?.outposts ?? []

  const setSelectedNetworkId = useCallback(
    (id: string | null) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (id) next.set('network', id)
          else next.delete('network')
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  useEffect(() => {
    if (networks.length === 0) return
    const ids = networks.map((network) => networkIdFromSk(network.sk))
    if (selectedNetworkId && ids.includes(selectedNetworkId)) return
    setSelectedNetworkId(ids[0] ?? null)
  }, [networks, selectedNetworkId, setSelectedNetworkId])

  const networkOutpostCount = useMemo(
    () => outposts.filter((outpost) => outpost.networkId === selectedNetworkId).length,
    [outposts, selectedNetworkId],
  )

  const refresh = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: ['stjornur'] })
  }, [queryClient])

  const inspectorOpen = inspectorPinned || inspectorMode.mode !== 'closed'
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  const dismissInspector = useCallback(() => {
    if (inspectorPinned || inspectorMode.mode === 'closed') return
    setInspectorMode({ mode: 'closed' })
  }, [inspectorPinned, inspectorMode.mode])

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') dismissInspector()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [dismissInspector])

  function openMode(next: StjornurInspectorMode) {
    setInspectorMode((current) => {
      if (
        current.mode === next.mode &&
        next.mode !== 'outpost-form' &&
        next.mode !== 'outpost-resource' &&
        next.mode !== 'network-form'
      ) {
        return { mode: 'closed' }
      }
      if (
        current.mode === 'network-form' &&
        next.mode === 'network-form' &&
        current.networkId === next.networkId
      ) {
        return { mode: 'closed' }
      }
      return next
    })
  }

  return (
    <TooltipProvider>
      <StudioLayout
        railLabel="Networks"
        rail={
          configured && !loading ? (
            <StjornurNetworksRail
              networks={networks}
              selectedId={selectedNetworkId}
              onSelect={setSelectedNetworkId}
              onInspect={(id) => openMode({ mode: 'network-form', networkId: id })}
              onNew={() => openMode({ mode: 'network-form', networkId: null })}
            />
          ) : null
        }
        contextBar={
          <StjornurContextBar
            outpostCount={data ? networkOutpostCount : undefined}
            inspectorPinned={inspectorPinned}
            onInspectorPinnedChange={setInspectorPinned}
            addOutpostDisabled={!selectedNetworkId}
            onAddOutpost={() => {
              if (!selectedNetworkId) {
                toast.error('Select a network first.')
                return
              }
              openMode({ mode: 'outpost-form', outpostId: null })
            }}
          />
        }
        canvas={
          loading ? (
            <StudioCanvasSkeleton />
          ) : !configured ? (
            <DataNotConfiguredNotice />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div data-inspector-dismiss-ignore>
                <StjornurControlBar
                  search={filterQuery}
                  onSearchChange={setFilterQuery}
                  onManageResources={() => openMode({ mode: 'resources' })}
                  onManageSystems={() => openMode({ mode: 'systems' })}
                  resourcesActive={inspectorMode.mode === 'resources'}
                  systemsActive={inspectorMode.mode === 'systems'}
                />
              </div>
              <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
                <StjornurClient
                  networks={networks}
                  outposts={outposts}
                  resources={data?.resources ?? []}
                  resourceTypes={data?.resourceTypes ?? []}
                  systems={data?.systems ?? []}
                  onRefresh={refresh}
                  selectedNetworkId={selectedNetworkId}
                  onSelectedNetworkIdChange={setSelectedNetworkId}
                  inspectorMode={inspectorMode}
                  onInspectorModeChange={setInspectorMode}
                  filterQuery={filterQuery}
                  canvasOnly
                  onRegisterInspector={setInspectorContent}
                />
              </div>
            </div>
          )
        }
        inspectorState={configured && !loading ? inspectorState : 'hidden'}
        inspectorHint="Open resources, systems, or an outpost"
        onDismissInspector={dismissInspector}
        inspector={
          inspectorContent ??
          (inspectorPinned ? (
            <InspectorEmptyState message="Open Resources, Systems, or Add Outpost from the toolbar." />
          ) : null)
        }
      />
    </TooltipProvider>
  )
}

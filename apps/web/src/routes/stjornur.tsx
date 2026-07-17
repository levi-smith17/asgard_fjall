import { useCallback, useEffect, useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { StarfieldSkeleton } from '@/components/core/ui/studio-skeletons'
import { StudioLayout } from '@/components/core/layout/studio-layout'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import {
  StarfieldClient,
  type StarfieldInspectorMode,
} from '@/components/apps/stjornur/starfield-client'
import { StarfieldControlBar } from '@/components/apps/stjornur/starfield-control-bar'
import { StjornurContextBar } from '@/components/apps/stjornur/stjornur-context-bar'
import { StjornurNetworksRail } from '@/components/apps/stjornur/stjornur-networks-rail'
import { TooltipProvider } from '@/components/core/ui/tooltip'
import { useInspectorPinned } from '@/hooks/use-inspector-pinned'
import { fetchFjallStatus } from '@/lib/data-api'
import { fetchStarfieldData } from '@/lib/stjornur-api'

function networkIdFromSk(sk: string): string {
  return sk.replace(/^SF#NETWORK#/, '')
}

export function StjornurPage() {
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [inspectorPinned, setInspectorPinned] = useInspectorPinned()
  const [inspectorMode, setInspectorMode] = useState<StarfieldInspectorMode>({ mode: 'closed' })
  const [inspectorContent, setInspectorContent] = useState<React.ReactNode>(null)
  const [filterQuery, setFilterQuery] = useState('')

  const selectedNetworkId = searchParams.get('network')

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const starfieldQuery = useQuery({
    queryKey: ['starfield'],
    queryFn: fetchStarfieldData,
    enabled: statusQuery.data?.configured === true,
  })

  const configured = statusQuery.data?.configured === true
  const loading = statusQuery.isLoading || (configured && starfieldQuery.isLoading)
  const data = starfieldQuery.data

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
    await queryClient.invalidateQueries({ queryKey: ['starfield'] })
  }, [queryClient])

  const inspectorOpen = inspectorPinned || inspectorMode.mode !== 'closed'
  const inspectorState = inspectorOpen ? 'open' : 'hint'

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape' && !inspectorPinned && inspectorMode.mode !== 'closed') {
        setInspectorMode({ mode: 'closed' })
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [inspectorPinned, inspectorMode.mode])

  function openMode(next: StarfieldInspectorMode) {
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
            <StarfieldSkeleton />
          ) : !configured ? (
            <DataNotConfiguredNotice />
          ) : (
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div
                data-starfield-toolbar
                onPointerDown={(event) => event.stopPropagation()}
              >
                <StarfieldControlBar
                  search={filterQuery}
                  onSearchChange={setFilterQuery}
                  onManageResources={() => openMode({ mode: 'resources' })}
                  onManageSystems={() => openMode({ mode: 'systems' })}
                  resourcesActive={inspectorMode.mode === 'resources'}
                  systemsActive={inspectorMode.mode === 'systems'}
                />
              </div>
              <div
                className="flex min-h-0 flex-1 flex-col overflow-hidden"
                onPointerDown={() => {
                  if (!inspectorPinned && inspectorMode.mode !== 'closed') {
                    setInspectorMode({ mode: 'closed' })
                  }
                }}
              >
                <StarfieldClient
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
        inspector={
          inspectorContent ??
          (inspectorPinned ? (
            <div className="flex h-full flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Inspector
                </p>
              </div>
              <p className="px-5 py-8 text-sm leading-relaxed text-muted-foreground">
                Open Resources, Systems, or Add Outpost from the toolbar.
              </p>
            </div>
          ) : null)
        }
      />
    </TooltipProvider>
  )
}

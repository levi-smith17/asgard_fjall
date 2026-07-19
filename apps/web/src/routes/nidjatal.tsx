import { useMemo, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { TooltipProvider } from '@/components/core/ui/tooltip'
import { StudioCanvasSkeleton } from '@/components/core/ui/studio-skeletons'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { NidjatalClient, type NidjatalPanelState } from '@/components/apps/nidjatal/nidjatal-client'
import { useAuth } from '@/hooks/use-auth'
import { fetchFjallProfile, fetchFjallStatus } from '@/lib/data-api'
import { fetchNidjatalKin } from '@/lib/nidjatal-api'
import type { NidjatalKin } from '@/lib/nidjatal-types'

export const NIDJATAL_SEED_ID = '__self__'

function parseName(fullName: string): { givenName: string; middleName?: string; surname: string } {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return { givenName: 'Me', surname: '' }
  if (parts.length === 1) return { givenName: parts[0], surname: '' }
  if (parts.length === 2) return { givenName: parts[0], surname: parts[1] }
  return {
    givenName: parts[0],
    middleName: parts.slice(1, -1).join(' '),
    surname: parts[parts.length - 1],
  }
}

export function NidjatalPage() {
  const { dataUser } = useAuth()
  const queryClient = useQueryClient()
  const [panel, setPanel] = useState<NidjatalPanelState>({ mode: 'closed' })

  const statusQuery = useQuery({
    queryKey: ['fjall-status'],
    queryFn: fetchFjallStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  const profileQuery = useQuery({
    queryKey: ['fjall-profile'],
    queryFn: fetchFjallProfile,
    enabled: Boolean(dataUser) && configured,
    retry: false,
    staleTime: 60_000,
  })

  const kinQuery = useQuery({
    queryKey: ['nidjatal', 'kin'],
    queryFn: fetchNidjatalKin,
    enabled: configured,
  })

  const kins = kinQuery.data ?? []
  const loading = statusQuery.isLoading || (configured && (profileQuery.isLoading || kinQuery.isLoading))

  const seedName = profileQuery.data?.name ?? dataUser?.email?.split('@')[0] ?? 'Me'

  const selfSeed = useMemo<NidjatalKin | null>(() => {
    if (kins.length > 0 || !dataUser) return null
    const { givenName, middleName, surname } = parseName(seedName)
    return {
      pk: `USER#${dataUser.id}`,
      sk: `KIN#${NIDJATAL_SEED_ID}`,
      givenName,
      middleName,
      surname,
      fatherUnknown: false,
      motherUnknown: false,
      bloodlines: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }, [kins.length, dataUser, seedName])

  const displayKins = kins.length > 0 ? kins : selfSeed ? [selfSeed] : []

  function refresh() {
    void queryClient.invalidateQueries({ queryKey: ['nidjatal'] })
  }

  return (
    <TooltipProvider>
      {loading ? (
        <StudioCanvasSkeleton />
      ) : !configured ? (
        <DataNotConfiguredNotice />
      ) : (
        <NidjatalClient
          kins={displayKins}
          seedKinId={selfSeed ? NIDJATAL_SEED_ID : null}
          onRefresh={refresh}
          panel={panel}
          onSetPanel={setPanel}
        />
      )}
    </TooltipProvider>
  )
}

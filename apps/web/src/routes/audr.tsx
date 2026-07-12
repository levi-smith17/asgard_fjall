import { useQuery } from '@tanstack/react-query'
import { CairnNotConfiguredNotice } from '@/components/cairn/cairn-not-configured'
import { AudrClient, AudrPageSkeleton } from '@/components/cairn/audr/audr-client'
import { fetchCairnStatus } from '@/lib/cairn-api'

export function AudrPage() {
  const statusQuery = useQuery({
    queryKey: ['cairn-status'],
    queryFn: fetchCairnStatus,
    retry: false,
    staleTime: 60_000,
  })

  const configured = statusQuery.data?.configured === true

  if (statusQuery.isLoading) {
    return <AudrPageSkeleton />
  }

  if (!configured) {
    return <CairnNotConfiguredNotice />
  }

  return <AudrClient />
}

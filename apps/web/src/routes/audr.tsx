import { useQuery } from '@tanstack/react-query'
import { DataNotConfiguredNotice } from '@/components/apps/data-not-configured'
import { AudrClient, AudrPageSkeleton } from '@/components/apps/audr/audr-client'
import { fetchCairnStatus } from '@/lib/data-api'

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
    return <DataNotConfiguredNotice />
  }

  return <AudrClient />
}

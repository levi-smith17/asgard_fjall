import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useTerminology } from '@/hooks/use-terminology'
import { isApexOrdstirrHost } from '@/lib/apex-ordstirr'
import { parsePublicManifestPath } from '@/lib/public-manifest-path'

const BASE_TITLE = 'Asgard Fjall'

function pageLabelForPath(pathname: string, terms: ReturnType<typeof useTerminology>['terms']): string | null {
  if (pathname.startsWith('/audr')) return terms.provisions
  if (pathname.startsWith('/dagatal')) return terms.calendar
  if (pathname === '/ordstirr' || pathname.startsWith('/ordstirr/')) {
    if (parsePublicManifestPath(pathname)) return terms.publicViewGroup
    return terms.resume
  }
  if (pathname.startsWith('/sogur')) return terms.notes
  if (pathname.startsWith('/nidjatal')) return terms.nidjatal
  if (pathname.startsWith('/stjornur')) return terms.starfield
  if (pathname.startsWith('/sendibod')) return terms.messages
  if (pathname.startsWith('/thing') || pathname.startsWith('/settings')) return terms.settings
  if (pathname.startsWith('/hlidskjalf') || pathname === '/' || pathname.startsWith('/basecamp')) {
    return terms.dashboard
  }
  return null
}

/** Sets `Asgard Fjall | Page` (skipped on apex public, which owns its own title). */
export function useAppDocumentTitle() {
  const { pathname } = useLocation()
  const { terms } = useTerminology()

  useEffect(() => {
    if (isApexOrdstirrHost()) return
    const page = pageLabelForPath(pathname, terms)
    document.title = page ? `${BASE_TITLE} | ${page}` : BASE_TITLE
  }, [pathname, terms])
}

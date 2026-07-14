export type PublicManifestView = 'manifest' | 'journey' | 'contact'

export type PublicManifestPathMatch = {
  username: string
  view: PublicManifestView
}

/** In-app Asgard public paths (not Cairn `/manifest/.../journey|contact`). */
export function publicManifestPath(
  username: string,
  view: PublicManifestView = 'manifest',
): string {
  if (view === 'journey') return `/ordstirr/${username}/ferd`
  if (view === 'contact') return `/ordstirr/${username}/ordsending`
  return `/ordstirr/${username}`
}

export function parsePublicManifestPath(pathname: string): PublicManifestPathMatch | null {
  const asgard = pathname.match(/^\/ordstirr\/([^/]+)(?:\/(ferd|ordsending))?\/?$/)
  if (asgard?.[1]) {
    const segment = asgard[2]
    const view: PublicManifestView =
      segment === 'ferd' ? 'journey' : segment === 'ordsending' ? 'contact' : 'manifest'
    return { username: asgard[1], view }
  }

  // Legacy Cairn paths — keep parsing so redirects can locate the view.
  const cairn = pathname.match(/^\/manifest\/([^/]+)(?:\/(journey|contact))?\/?$/)
  if (cairn?.[1]) {
    const view = (cairn[2] as 'journey' | 'contact' | undefined) ?? 'manifest'
    return { username: cairn[1], view }
  }

  return null
}

/** Map a legacy Cairn public URL onto the Asgard path (or null if not a public path). */
export function asgardPublicPathFromLegacy(pathname: string): string | null {
  const match = parsePublicManifestPath(pathname)
  if (!match) return null
  if (!pathname.startsWith('/manifest/')) return null
  return publicManifestPath(match.username, match.view)
}

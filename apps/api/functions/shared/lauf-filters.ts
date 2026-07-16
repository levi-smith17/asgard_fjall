export interface NormalizedLauf {
  id: string
  title: string
  url: string
  favicon: string | null
  read: boolean
  readLater: boolean
  trailId: string | null
  markers: { markerId: string; marker: { id: string; name: string; color: string; icon: string | null } }[]
  createdAt: string
}

export interface LaufFilterParams {
  search: string
  markerIds: string[]
  readLater: boolean
  dateFrom: string
  dateTo: string
  sort: string
}

export function parseLaufFilterParams(qs: Record<string, string | undefined>): LaufFilterParams {
  return {
    search: qs.search ?? '',
    markerIds: qs.markerId ? qs.markerId.split(',').filter(Boolean) : [],
    readLater: qs.readLater === 'true',
    dateFrom: qs.dateFrom ?? '',
    dateTo: qs.dateTo ?? '',
    sort: qs.sort ?? 'alpha',
  }
}

export function filterLaufar<T extends NormalizedLauf>(laufar: T[], params: LaufFilterParams): T[] {
  let result = [...laufar]

  if (params.search) {
    const q = params.search.toLowerCase()
    result = result.filter(
      (w) => w.title?.toLowerCase().includes(q) || w.url?.toLowerCase().includes(q),
    )
  }
  if (params.markerIds.length > 0) {
    result = result.filter((w) =>
      params.markerIds.some((id) => w.markers.some((m) => m.markerId === id)),
    )
  }
  if (params.readLater) {
    result = result.filter((w) => w.readLater)
  }
  if (params.dateFrom) {
    const from = new Date(params.dateFrom).getTime()
    result = result.filter((w) => new Date(w.createdAt).getTime() >= from)
  }
  if (params.dateTo) {
    const to = new Date(params.dateTo).getTime()
    result = result.filter((w) => new Date(w.createdAt).getTime() <= to)
  }

  return result
}

export function sortLaufar<T extends NormalizedLauf>(laufar: T[], sort: string): T[] {
  const result = [...laufar]
  if (sort === 'newest') {
    result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  } else if (sort === 'oldest') {
    result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
  } else {
    result.sort((a, b) => a.title.localeCompare(b.title))
  }
  return result
}

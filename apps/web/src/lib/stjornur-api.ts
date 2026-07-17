import { fjallFetch } from '@/lib/data-client'
import type { SfNetwork, SfOutpost, SfResource } from '@/lib/starfield-types'

/**
 * Starfield calls go straight to Fjall via fjallFetch.
 * Fjall often returns 204 / empty bodies on writes; GETs wrap payloads in `{ data }`.
 * fjallFetch already unwraps `{ data }` and handles 204/empty — this layer just
 * normalizes nullish list responses.
 */
async function starfieldFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const json = await fjallFetch<T | undefined>(path, init)
  if (json == null) return undefined as T
  return json
}

export async function getNetworks(): Promise<SfNetwork[]> {
  return (await starfieldFetch<SfNetwork[]>('/starfield/networks')) ?? []
}

export async function createNetwork(data: { name: string; abbreviation: string }): Promise<unknown> {
  return starfieldFetch('/starfield/networks', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateNetwork(
  id: string,
  data: { name: string; abbreviation: string },
): Promise<unknown> {
  return starfieldFetch(`/starfield/networks/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteNetwork(id: string): Promise<void> {
  await fjallFetch<void>(`/starfield/networks/${id}`, { method: 'DELETE' })
}

export async function getAllOutposts(): Promise<SfOutpost[]> {
  return (await starfieldFetch<SfOutpost[]>('/starfield/outposts')) ?? []
}

export async function createOutpost(data: {
  networkId: string
  system: string
  planet: string
  parentId?: string
  transferStationLimit?: number
}): Promise<unknown> {
  return starfieldFetch('/starfield/outposts', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export async function updateOutpost(id: string, data: Record<string, unknown>): Promise<unknown> {
  return starfieldFetch(`/starfield/outposts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function deleteOutpost(id: string): Promise<void> {
  await fjallFetch<void>(`/starfield/outposts/${id}`, { method: 'DELETE' })
}

export async function updateOutpostPosition(
  id: string,
  position: { x: number; y: number },
): Promise<void> {
  await starfieldFetch(`/starfield/outposts/${id}/position`, {
    method: 'PATCH',
    body: JSON.stringify(position),
  })
}

export async function upsertOutpostResource(
  outpostId: string,
  resourceId: string,
  data: {
    onsite: boolean
    origin?: boolean
    supplies?: {
      fromOutpostId?: string | null
      fromPlanet?: string | null
      fromSystem?: string | null
      relay?: { planet: string; system: string } | null
    }[]
  },
): Promise<void> {
  await starfieldFetch(`/starfield/outposts/${outpostId}/resources/${resourceId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export async function removeOutpostResource(outpostId: string, resourceId: string): Promise<void> {
  await fjallFetch<void>(`/starfield/outposts/${outpostId}/resources/${resourceId}`, {
    method: 'DELETE',
  })
}

export async function getSystems(): Promise<unknown[]> {
  return (await starfieldFetch<unknown[]>('/starfield/systems')) ?? []
}

export async function createSystem(name: string): Promise<unknown> {
  return starfieldFetch('/starfield/systems', {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updateSystem(id: string, name: string): Promise<void> {
  await starfieldFetch(`/starfield/systems/${id}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function deleteSystem(id: string): Promise<void> {
  await fjallFetch<void>(`/starfield/systems/${id}`, { method: 'DELETE' })
}

export async function addPlanet(systemId: string, name: string): Promise<unknown> {
  return starfieldFetch(`/starfield/systems/${systemId}/planets`, {
    method: 'POST',
    body: JSON.stringify({ name }),
  })
}

export async function updatePlanet(systemId: string, planetId: string, name: string): Promise<void> {
  await starfieldFetch(`/starfield/systems/${systemId}/planets/${planetId}`, {
    method: 'PUT',
    body: JSON.stringify({ name }),
  })
}

export async function deletePlanet(systemId: string, planetId: string): Promise<void> {
  await fjallFetch<void>(`/starfield/systems/${systemId}/planets/${planetId}`, {
    method: 'DELETE',
  })
}

export async function getResources(): Promise<SfResource[]> {
  return (await starfieldFetch<SfResource[]>('/starfield/resources')) ?? []
}

export async function saveResource(data: {
  id?: string
  name: string
  abbreviation: string
  type: string
  tier?: number | null
  mined?: boolean
  ingredients?: string[]
}): Promise<unknown> {
  const { id, ...body } = data
  if (id) {
    return starfieldFetch(`/starfield/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    })
  }
  return starfieldFetch('/starfield/resources', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export async function deleteResource(id: string): Promise<void> {
  await fjallFetch<void>(`/starfield/resources/${id}`, { method: 'DELETE' })
}

export async function fetchStarfieldData() {
  const [networks, outposts, resources, systems] = await Promise.all([
    getNetworks(),
    getAllOutposts(),
    getResources(),
    getSystems().catch(() => [] as unknown[]),
  ])

  return {
    networks,
    outposts: outposts.map((f) => ({
      ...f,
      id: (f as SfOutpost & { id?: string }).id ?? f.sk.replace(/^SF#FACILITY#/, ''),
    })) as (SfOutpost & { id: string })[],
    resources: resources.map((r) => ({
      ...r,
      id: (r as SfResource & { id?: string }).id ?? r.sk.replace(/^RESOURCE#/, ''),
    })) as (SfResource & { id: string })[],
    resourceTypes: [] as unknown[],
    systems: systems ?? [],
  }
}

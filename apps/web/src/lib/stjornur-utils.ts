import type { StjornurOutpost, StjornurOutpostResource, StjornurOutpostSupply } from '@/lib/stjornur-types'

export type OutpostWithId = StjornurOutpost & { id: string }

/** Normalize legacy flat fromPlanet/relay into supplies[]. */
export function normalizeOutpostResource(fr: StjornurOutpostResource): StjornurOutpostResource {
  if (fr.supplies?.length) return fr
  if (fr.fromPlanet || fr.fromOutpostId) {
    return {
      ...fr,
      supplies: [{
        fromOutpostId: fr.fromOutpostId ?? null,
        fromPlanet: fr.fromPlanet ?? null,
        fromSystem: fr.fromSystem ?? null,
        relay: fr.relay ?? null,
      }],
    }
  }
  return { ...fr, supplies: [] }
}

export function getSupplyLines(fr: StjornurOutpostResource): StjornurOutpostSupply[] {
  const normalized = normalizeOutpostResource(fr)
  return normalized.supplies ?? []
}

/** Fill fromPlanet/fromSystem from fromOutpostId when only the id was persisted. */
export function enrichSupplyLine(
  supply: StjornurOutpostSupply,
  outposts: OutpostWithId[]
): StjornurOutpostSupply {
  if (supply.fromPlanet && supply.fromSystem) return supply
  if (supply.fromOutpostId) {
    const src = outposts.find(o => o.id === supply.fromOutpostId)
    if (src) {
      return {
        ...supply,
        fromPlanet: supply.fromPlanet ?? src.planet,
        fromSystem: supply.fromSystem ?? src.system,
      }
    }
  }
  return supply
}

export function getEnrichedSupplyLines(
  fr: StjornurOutpostResource,
  outposts: OutpostWithId[]
): StjornurOutpostSupply[] {
  return getSupplyLines(fr).map(s => enrichSupplyLine(s, outposts))
}

function norm(s: string | null | undefined): string {
  return (s ?? '').trim()
}

export function getIncomingSupplyLines(
  fr: StjornurOutpostResource,
  outposts: OutpostWithId[]
): StjornurOutpostSupply[] {
  return getSupplyLines(fr)
    .map(s => enrichSupplyLine(s, outposts))
    .filter(isIncomingSupplyLine)
}

export function resolveSourceOutpostId(
  supply: StjornurOutpostSupply,
  outposts: OutpostWithId[]
): string | null {
  const s = enrichSupplyLine(supply, outposts)
  const planet = norm(s.fromPlanet)
  const system = norm(s.fromSystem)

  if (planet && system) {
    const match = outposts.find(
      o => norm(o.planet) === planet && norm(o.system) === system
    )
    if (match) return match.id
  }

  if (s.fromOutpostId && outposts.some(o => o.id === s.fromOutpostId)) {
    return s.fromOutpostId
  }

  if (planet) {
    const matches = outposts.filter(o => norm(o.planet) === planet)
    if (matches.length === 1) return matches[0].id
  }

  return null
}

/** Resolve the on-diagram relay hop for transfer outbound / export arrows. */
export function resolveRelayOutpostId(
  supply: StjornurOutpostSupply,
  outposts: OutpostWithId[]
): string | null {
  const relay = supply.relay
  if (!relay) return null
  const planet = norm(relay.planet)
  const system = norm(relay.system)

  if (planet && system) {
    const match = outposts.find(
      o => norm(o.planet) === planet && norm(o.system) === system
    )
    if (match) return match.id
  }

  if (planet) {
    const matches = outposts.filter(o => norm(o.planet) === planet)
    if (matches.length === 1) return matches[0].id
  }

  return null
}

/** Outpost that consumes a transfer station for export (relay hop when set, else source). */
export function resolveTransferOutpostId(
  supply: StjornurOutpostSupply,
  outposts: OutpostWithId[]
): string | null {
  const relayId = resolveRelayOutpostId(supply, outposts)
  if (relayId) return relayId
  return resolveSourceOutpostId(supply, outposts)
}

export function isIncomingSupplyLine(supply: StjornurOutpostSupply): boolean {
  return !!(supply.fromOutpostId || supply.fromPlanet)
}

export function countTransferStations(
  outpost: OutpostWithId,
  outposts: OutpostWithId[]
): number {
  let inboundCount = 0
  for (const fr of outpost.resources ?? []) {
    if (fr.onsite) continue
    const incomingLines = getIncomingSupplyLines(fr, outposts)
    if (fr.origin && incomingLines.length === 0) continue
    inboundCount += incomingLines.length
  }

  let outboundCount = 0
  for (const o of outposts) {
    if (o.id === outpost.id) continue
    for (const fr of o.resources ?? []) {
      if (fr.onsite) continue
      for (const s of getIncomingSupplyLines(fr, outposts)) {
        if (resolveTransferOutpostId(s, outposts) === outpost.id) outboundCount++
      }
    }
  }

  return inboundCount + outboundCount
}

/** Outposts whose resources reference this outpost as a source (for export arrows). */
export function getShippedOutResourceIds(
  outpostId: string,
  outposts: OutpostWithId[]
): Set<string> {
  const ids = new Set<string>()
  for (const o of outposts) {
    if (o.id === outpostId) continue
    for (const fr of o.resources ?? []) {
      if (fr.onsite) continue
      for (const s of getIncomingSupplyLines(fr, outposts)) {
        if (resolveTransferOutpostId(s, outposts) === outpostId) {
          ids.add(fr.resourceId)
        }
      }
    }
  }
  return ids
}

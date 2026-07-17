import { describe, expect, it } from 'vitest'
import { mapCairnApiPathToAsgard } from './map-api-path'

describe('mapCairnApiPathToAsgard', () => {
  it('remaps core product paths', () => {
    expect(mapCairnApiPathToAsgard('/waypoints')).toBe('/laufar')
    expect(mapCairnApiPathToAsgard('/burn/abc?x=1')).toBe('/surtr/abc?x=1')
    expect(mapCairnApiPathToAsgard('/supplylines/summary')).toBe('/idunn/summary')
    expect(mapCairnApiPathToAsgard('/starfield/networks')).toBe('/stjornur/networks')
    expect(mapCairnApiPathToAsgard('/settings/waypoints')).toBe('/thing/laufar')
    expect(mapCairnApiPathToAsgard('/itinerary/events')).toBe('/dagatal/events')
  })

  it('remaps public Ordstirr paths', () => {
    expect(mapCairnApiPathToAsgard('/public/manifest/levi/journey')).toBe(
      '/public/ordstirr/levi/ferd',
    )
    expect(mapCairnApiPathToAsgard('/public/manifest/levi/contact')).toBe(
      '/public/ordstirr/levi/ordsending',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { mapFjallApiPathToAsgard } from './map-api-path'

describe('mapFjallApiPathToAsgard', () => {
  it('remaps core product paths', () => {
    expect(mapFjallApiPathToAsgard('/waypoints')).toBe('/laufar')
    expect(mapFjallApiPathToAsgard('/burn/abc?x=1')).toBe('/surtr/abc?x=1')
    expect(mapFjallApiPathToAsgard('/supplylines/summary')).toBe('/idunn/summary')
    expect(mapFjallApiPathToAsgard('/starfield/networks')).toBe('/stjornur/networks')
    expect(mapFjallApiPathToAsgard('/settings/waypoints')).toBe('/thing/laufar')
    expect(mapFjallApiPathToAsgard('/itinerary/events')).toBe('/dagatal/events')
  })

  it('remaps public Ordstirr paths', () => {
    expect(mapFjallApiPathToAsgard('/public/manifest/levi/journey')).toBe(
      '/public/ordstirr/levi/ferd',
    )
    expect(mapFjallApiPathToAsgard('/public/manifest/levi/contact')).toBe(
      '/public/ordstirr/levi/ordsending',
    )
  })
})

import { describe, expect, it } from 'vitest'
import { mapFjallApiPathToAsgard } from './map-api-path'

describe('mapFjallApiPathToAsgard', () => {
  it('remaps core product paths', () => {
    expect(mapFjallApiPathToAsgard('/laufar')).toBe('/laufar')
    expect(mapFjallApiPathToAsgard('/waypoints')).toBe('/laufar')
    expect(mapFjallApiPathToAsgard('/trails')).toBe('/greinar')
    expect(mapFjallApiPathToAsgard('/markers')).toBe('/runir')
    expect(mapFjallApiPathToAsgard('/itinerary/events')).toBe('/dagatal/events')
    expect(mapFjallApiPathToAsgard('/burn/abc?x=1')).toBe('/surtr/abc?x=1')
    expect(mapFjallApiPathToAsgard('/supplylines/summary')).toBe('/idunn/summary')
    expect(mapFjallApiPathToAsgard('/cache')).toBe('/skatt')
    expect(mapFjallApiPathToAsgard('/surtr')).toBe('/surtr')
    expect(mapFjallApiPathToAsgard('/idunn/summary')).toBe('/idunn/summary')
    expect(mapFjallApiPathToAsgard('/skatt')).toBe('/skatt')
    expect(mapFjallApiPathToAsgard('/starfield/networks')).toBe('/stjornur/networks')
    expect(mapFjallApiPathToAsgard('/settings/waypoints')).toBe('/thing/laufar')
    expect(mapFjallApiPathToAsgard('/settings/laufar')).toBe('/thing/laufar')
    expect(mapFjallApiPathToAsgard('/dagatal/events')).toBe('/dagatal/events')
  })

  it('remaps Sögur / Saga paths via /logs → /sogur', () => {
    expect(mapFjallApiPathToAsgard('/logs')).toBe('/sogur')
    expect(mapFjallApiPathToAsgard('/logs/abc')).toBe('/sogur/abc')
    expect(mapFjallApiPathToAsgard('/logs/sagas')).toBe('/sogur/sagas')
    expect(mapFjallApiPathToAsgard('/logs/sagas/abc')).toBe('/sogur/sagas/abc')
    expect(mapFjallApiPathToAsgard('/logs/sagas/abc/reorder')).toBe('/sogur/sagas/abc/reorder')
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

import { describe, expect, it } from 'vitest'
import { normalizeFjallLogMarkers } from './data-api'

describe('normalizeFjallLogMarkers', () => {
  it('normalizes flat embedded Run snapshots', () => {
    expect(
      normalizeFjallLogMarkers([
        { id: 'r1', name: 'Alpha', color: '#111', icon: 'star' },
        { id: 'r2', name: 'Beta', color: '#222' },
      ]),
    ).toEqual([
      {
        markerId: 'r1',
        marker: { id: 'r1', name: 'Alpha', color: '#111', icon: 'star' },
      },
      {
        markerId: 'r2',
        marker: { id: 'r2', name: 'Beta', color: '#222', icon: null },
      },
    ])
  })

  it('normalizes legacy junction shapes', () => {
    expect(
      normalizeFjallLogMarkers([
        {
          markerId: 'r1',
          marker: { id: 'r1', name: 'Alpha', color: '#111', icon: null },
        },
      ]),
    ).toEqual([
      {
        markerId: 'r1',
        marker: { id: 'r1', name: 'Alpha', color: '#111', icon: null },
      },
    ])
  })

  it('skips invalid entries', () => {
    expect(normalizeFjallLogMarkers([null, 'x', { name: 'no-id' }, { id: 'only-id' }])).toEqual([])
    expect(normalizeFjallLogMarkers(undefined)).toEqual([])
  })
})

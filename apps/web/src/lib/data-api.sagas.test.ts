import { describe, expect, it } from 'vitest'
import { normalizeFjallLogRunir } from './data-api'

describe('normalizeFjallLogRunir', () => {
  it('normalizes flat embedded Run snapshots', () => {
    expect(
      normalizeFjallLogRunir([
        { id: 'r1', name: 'Alpha', color: '#111', icon: 'star' },
        { id: 'r2', name: 'Beta', color: '#222' },
      ]),
    ).toEqual([
      {
        runId: 'r1',
        run: { id: 'r1', name: 'Alpha', color: '#111', icon: 'star' },
      },
      {
        runId: 'r2',
        run: { id: 'r2', name: 'Beta', color: '#222', icon: null },
      },
    ])
  })

  it('normalizes legacy junction shapes', () => {
    expect(
      normalizeFjallLogRunir([
        {
          runId: 'r1',
          run: { id: 'r1', name: 'Alpha', color: '#111', icon: null },
        },
      ]),
    ).toEqual([
      {
        runId: 'r1',
        run: { id: 'r1', name: 'Alpha', color: '#111', icon: null },
      },
    ])
  })

  it('skips invalid entries', () => {
    expect(normalizeFjallLogRunir([null, 'x', { name: 'no-id' }, { id: 'only-id' }])).toEqual([])
    expect(normalizeFjallLogRunir(undefined)).toEqual([])
  })
})

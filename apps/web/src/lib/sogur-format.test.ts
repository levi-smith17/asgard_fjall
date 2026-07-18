import { describe, expect, it } from 'vitest'
import type { FjallLogView, FjallSagaView } from '@/lib/data-api'
import {
  buildSogurWorkspace,
  isLegacySagaId,
  legacySagaId,
  thattrPreview,
} from '@/lib/sogur-format'

function log(partial: Partial<FjallLogView> & Pick<FjallLogView, 'id'>): FjallLogView {
  return {
    title: null,
    content: '<p>Hello</p>',
    position: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: null,
    sagaId: null,
    greinId: null,
    laufId: null,
    greinName: null,
    runir: [],
    ...partial,
  }
}

describe('buildSogurWorkspace', () => {
  it('nests Thattr under real sagas by sagaId and order', () => {
    const sagas: FjallSagaView[] = [
      {
        id: 'saga-1',
        name: 'Voyage',
        greinId: 'grein-1',
        greinName: 'North',
        orderedThattrIds: ['b', 'a'],
        runir: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: null,
      },
    ]
    const logs = [
      log({ id: 'a', sagaId: 'saga-1', title: 'A' }),
      log({ id: 'b', sagaId: 'saga-1', title: 'B' }),
      log({ id: 'c', title: 'Standalone' }),
    ]
    const workspace = buildSogurWorkspace(sagas, logs)
    expect(workspace.sagas).toHaveLength(1)
    expect(workspace.logsBySagaId.get('saga-1')?.map((entry) => entry.id)).toEqual(['b', 'a'])
    expect(workspace.standaloneThaettir.map((entry) => entry.id)).toEqual(['c'])
  })

  it('synthesizes legacy Grein buckets for greinId-only Thattr', () => {
    const logs = [
      log({
        id: 'old-1',
        greinId: 'grein-9',
        greinName: 'Legacy Grein',
        title: 'Page one',
        createdAt: '2026-01-02T00:00:00.000Z',
      }),
      log({
        id: 'old-2',
        greinId: 'grein-9',
        greinName: 'Legacy Grein',
        title: 'Page two',
        createdAt: '2026-01-01T00:00:00.000Z',
      }),
    ]
    const workspace = buildSogurWorkspace([], logs)
    expect(workspace.sagas).toHaveLength(1)
    const saga = workspace.sagas[0]!
    expect(saga.synthetic).toBe(true)
    expect(isLegacySagaId(saga.id)).toBe(true)
    expect(saga.id).toBe(legacySagaId('grein-9'))
    expect(saga.name).toBe('Legacy Grein')
    expect(workspace.logsBySagaId.get(saga.id)?.map((entry) => entry.id)).toEqual([
      'old-2',
      'old-1',
    ])
    expect(workspace.standaloneThaettir).toHaveLength(0)
  })

  it('keeps leftover greinId Thattr standalone when a real saga already owns that Grein', () => {
    const sagas: FjallSagaView[] = [
      {
        id: 'saga-1',
        name: 'Real',
        greinId: 'grein-1',
        greinName: 'Shared',
        orderedThattrIds: ['attached'],
        runir: [],
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: null,
      },
    ]
    const logs = [
      log({ id: 'attached', sagaId: 'saga-1', greinId: 'grein-1' }),
      log({ id: 'orphan', greinId: 'grein-1', title: 'Orphan' }),
    ]
    const workspace = buildSogurWorkspace(sagas, logs)
    expect(workspace.sagas).toHaveLength(1)
    expect(workspace.standaloneThaettir.map((entry) => entry.id)).toEqual(['orphan'])
  })
})

describe('thattrPreview', () => {
  it('prefers title, then plain text from blocks or legacy HTML', () => {
    expect(thattrPreview(log({ id: '1', title: 'Named' }))).toBe('Named')
    expect(
      thattrPreview(
        log({
          id: '2',
          content: JSON.stringify({
            version: 1,
            blocks: [{ id: 'b1', type: 'rich-text', content: '<p>Block text</p>' }],
          }),
        }),
      ),
    ).toBe('Block text')
    expect(thattrPreview(log({ id: '3', content: '<p>Legacy</p>' }))).toBe('Legacy')
  })
})

import type { FjallThattrView, FjallSagaView } from '@/lib/data-api'
import { parseSogurBlocks, sogurBlocksToPlainText } from '@/lib/sogur-blocks'

export const LEGACY_SAGA_PREFIX = '__legacy__'

export type SogurSagaModel = FjallSagaView & {
  /** Client-only Grein-bucket until attached to a real SAGA# record. */
  synthetic?: boolean
}

export function isLegacySagaId(id: string): boolean {
  return id.startsWith(LEGACY_SAGA_PREFIX)
}

export function legacySagaId(greinId: string): string {
  return `${LEGACY_SAGA_PREFIX}${greinId}`
}

export function greinIdFromLegacySaga(id: string): string | null {
  return isLegacySagaId(id) ? id.slice(LEGACY_SAGA_PREFIX.length) : null
}

export function sortFjallThaettir(thaettir: FjallThattrView[]): FjallThattrView[] {
  return [...thaettir].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position
    if (a.position != null) return -1
    if (b.position != null) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

export function thattrPreview(thattr: FjallThattrView, emptyLabel = 'Empty note'): string {
  const fromTitle = thattr.title?.trim()
  if (fromTitle) return fromTitle
  const plain = sogurBlocksToPlainText(parseSogurBlocks(thattr.content)).trim()
  return plain.slice(0, 120) || emptyLabel
}

export function thattrSnippet(thattr: FjallThattrView): string {
  return sogurBlocksToPlainText(parseSogurBlocks(thattr.content)).trim().slice(0, 160)
}

function orderThaettirForSaga(saga: SogurSagaModel, thaettir: FjallThattrView[]): FjallThattrView[] {
  const byId = new Map(thaettir.map((thattr) => [thattr.id, thattr]))
  const ordered: FjallThattrView[] = []
  for (const id of saga.orderedThattrIds) {
    const thattr = byId.get(id)
    if (thattr) {
      ordered.push(thattr)
      byId.delete(id)
    }
  }
  ordered.push(...sortFjallThaettir([...byId.values()]))
  return ordered
}

/**
 * Prefer real SAGA# records. Grein-bucketed Thattr without sagaId become
 * synthetic sagas so existing data remains visible until materialised.
 */
export function buildSogurWorkspace(
  sagas: FjallSagaView[],
  thaettir: FjallThattrView[],
): {
  sagas: SogurSagaModel[]
  thaettirBySagaId: Map<string, FjallThattrView[]>
  standaloneThaettir: FjallThattrView[]
} {
  const thaettirBySagaId = new Map<string, FjallThattrView[]>()
  const attached = new Set<string>()
  const realSagaIds = new Set(sagas.map((saga) => saga.id))

  for (const thattr of thaettir) {
    if (thattr.sagaId && realSagaIds.has(thattr.sagaId)) {
      const bucket = thaettirBySagaId.get(thattr.sagaId)
      if (bucket) bucket.push(thattr)
      else thaettirBySagaId.set(thattr.sagaId, [thattr])
      attached.add(thattr.id)
    }
  }

  const remaining = thaettir.filter((thattr) => !attached.has(thattr.id))
  const legacyByGrein = new Map<string, FjallThattrView[]>()
  const standaloneThaettir: FjallThattrView[] = []

  for (const thattr of remaining) {
    if (thattr.greinId) {
      const bucket = legacyByGrein.get(thattr.greinId)
      if (bucket) bucket.push(thattr)
      else legacyByGrein.set(thattr.greinId, [thattr])
    } else {
      standaloneThaettir.push(thattr)
    }
  }

  const greinarCoveredByReal = new Set(
    sagas.map((saga) => saga.greinId).filter((id): id is string => Boolean(id)),
  )

  const synthetic: SogurSagaModel[] = []
  for (const [greinId, greinLogs] of legacyByGrein.entries()) {
    if (greinarCoveredByReal.has(greinId)) {
      // Grein already has a real saga — keep leftover Thattr standalone.
      standaloneThaettir.push(...greinLogs)
      continue
    }
    const sorted = sortFjallThaettir(greinLogs)
    const sagaId = legacySagaId(greinId)
    const latest = sorted.reduce(
      (max, thattr) =>
        new Date(thattr.updatedAt ?? thattr.createdAt).getTime() > new Date(max).getTime()
          ? (thattr.updatedAt ?? thattr.createdAt)
          : max,
      sorted[0]?.updatedAt ?? sorted[0]?.createdAt ?? new Date(0).toISOString(),
    )
    synthetic.push({
      id: sagaId,
      name: sorted[0]?.greinName ?? 'Untitled',
      greinId,
      greinName: sorted[0]?.greinName ?? null,
      orderedThattrIds: sorted.map((thattr) => thattr.id),
      runir: [],
      createdAt: sorted[0]?.createdAt ?? new Date(0).toISOString(),
      updatedAt: latest,
      synthetic: true,
    })
    thaettirBySagaId.set(sagaId, sorted)
  }

  const mergedSagas = [...sagas, ...synthetic].sort((a, b) => a.name.localeCompare(b.name))
  for (const saga of mergedSagas) {
    const sagaLogs = thaettirBySagaId.get(saga.id) ?? []
    thaettirBySagaId.set(saga.id, orderThaettirForSaga(saga, sagaLogs))
  }

  return {
    sagas: mergedSagas,
    thaettirBySagaId,
    standaloneThaettir: sortFjallThaettir(standaloneThaettir),
  }
}

import type { FjallLogView, FjallSagaView } from '@/lib/data-api'
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

export function sortFjallLogs(logs: FjallLogView[]): FjallLogView[] {
  return [...logs].sort((a, b) => {
    if (a.position != null && b.position != null) return a.position - b.position
    if (a.position != null) return -1
    if (b.position != null) return 1
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  })
}

export function thattrPreview(log: FjallLogView, emptyLabel = 'Empty note'): string {
  const fromTitle = log.title?.trim()
  if (fromTitle) return fromTitle
  const plain = sogurBlocksToPlainText(parseSogurBlocks(log.content)).trim()
  return plain.slice(0, 120) || emptyLabel
}

export function thattrSnippet(log: FjallLogView): string {
  return sogurBlocksToPlainText(parseSogurBlocks(log.content)).trim().slice(0, 160)
}

function orderLogsForSaga(saga: SogurSagaModel, logs: FjallLogView[]): FjallLogView[] {
  const byId = new Map(logs.map((log) => [log.id, log]))
  const ordered: FjallLogView[] = []
  for (const id of saga.orderedThattrIds) {
    const log = byId.get(id)
    if (log) {
      ordered.push(log)
      byId.delete(id)
    }
  }
  ordered.push(...sortFjallLogs([...byId.values()]))
  return ordered
}

/**
 * Prefer real SAGA# records. Grein-bucketed Thattr without sagaId become
 * synthetic sagas so existing data remains visible until materialised.
 */
export function buildSogurWorkspace(
  sagas: FjallSagaView[],
  logs: FjallLogView[],
): {
  sagas: SogurSagaModel[]
  logsBySagaId: Map<string, FjallLogView[]>
  standaloneThaettir: FjallLogView[]
} {
  const logsBySagaId = new Map<string, FjallLogView[]>()
  const attached = new Set<string>()
  const realSagaIds = new Set(sagas.map((saga) => saga.id))

  for (const log of logs) {
    if (log.sagaId && realSagaIds.has(log.sagaId)) {
      const bucket = logsBySagaId.get(log.sagaId)
      if (bucket) bucket.push(log)
      else logsBySagaId.set(log.sagaId, [log])
      attached.add(log.id)
    }
  }

  const remaining = logs.filter((log) => !attached.has(log.id))
  const legacyByGrein = new Map<string, FjallLogView[]>()
  const standaloneThaettir: FjallLogView[] = []

  for (const log of remaining) {
    if (log.greinId) {
      const bucket = legacyByGrein.get(log.greinId)
      if (bucket) bucket.push(log)
      else legacyByGrein.set(log.greinId, [log])
    } else {
      standaloneThaettir.push(log)
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
    const sorted = sortFjallLogs(greinLogs)
    const sagaId = legacySagaId(greinId)
    const latest = sorted.reduce(
      (max, log) =>
        new Date(log.updatedAt ?? log.createdAt).getTime() > new Date(max).getTime()
          ? (log.updatedAt ?? log.createdAt)
          : max,
      sorted[0]?.updatedAt ?? sorted[0]?.createdAt ?? new Date(0).toISOString(),
    )
    synthetic.push({
      id: sagaId,
      name: sorted[0]?.greinName ?? 'Untitled',
      greinId,
      greinName: sorted[0]?.greinName ?? null,
      orderedThattrIds: sorted.map((log) => log.id),
      runir: [],
      createdAt: sorted[0]?.createdAt ?? new Date(0).toISOString(),
      updatedAt: latest,
      synthetic: true,
    })
    logsBySagaId.set(sagaId, sorted)
  }

  const mergedSagas = [...sagas, ...synthetic].sort((a, b) => a.name.localeCompare(b.name))
  for (const saga of mergedSagas) {
    const sagaLogs = logsBySagaId.get(saga.id) ?? []
    logsBySagaId.set(saga.id, orderLogsForSaga(saga, sagaLogs))
  }

  return {
    sagas: mergedSagas,
    logsBySagaId,
    standaloneThaettir: sortFjallLogs(standaloneThaettir),
  }
}

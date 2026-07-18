import type { FjallRun, FjallRunView, FjallGrein, FjallGreinView, FjallLauf, FjallLaufView } from '@/lib/data-types'

export function extractEntityId(sk: string): string {
  const hash = sk.lastIndexOf('#')
  return hash >= 0 ? sk.slice(hash + 1) : sk
}

export function secureRemoteAssetUrl(url: string): string {
  return url.startsWith('http://') ? `https://${url.slice('http://'.length)}` : url
}

export function toGreinView(grein: FjallGrein): FjallGreinView {
  return {
    id: extractEntityId(grein.sk),
    name: grein.name,
    hiddenPages: Array.isArray(grein.hiddenPages) ? grein.hiddenPages : null,
    createdAt: grein.createdAt,
  }
}

export function toRunView(run: FjallRun): FjallRunView {
  return {
    id: extractEntityId(run.sk),
    name: run.name,
    color: run.color,
    icon: run.icon ?? null,
    createdAt: run.createdAt,
    laufCount: run.laufCount ?? 0,
  }
}

export function toLaufView(
  lauf: FjallLauf,
  greinarById: Map<string, FjallGreinView>,
): FjallLaufView {
  const greinId = lauf.greinId ?? null
  return {
    id: extractEntityId(lauf.sk),
    url: lauf.url,
    title: lauf.title,
    description: lauf.description ?? '',
    favicon: lauf.favicon ?? '',
    notes: lauf.notes ?? '',
    read: lauf.read,
    readLater: lauf.readLater,
    greinId,
    greinName: greinId ? greinarById.get(greinId)?.name ?? null : null,
    runir: lauf.runir ?? [],
    createdAt: lauf.createdAt,
  }
}

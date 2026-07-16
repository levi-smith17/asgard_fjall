/** DynamoDB sort-key prefixes — Asgard greenfield (remap from Cairn on data cutover). */
export const LAUF_PREFIX = 'LAUF#'
export const GREIN_PREFIX = 'GREIN#'
export const RUN_PREFIX = 'RUN#'
export const SURTR_PREFIX = 'SURTR#'
export const IDUNN_PREFIX = 'IDUNN#'
export const SKATT_PREFIX = 'SKATT#'
export const SJODR_PREFIX = 'SJODR#'

export function laufSk(id: string): string {
  return `${LAUF_PREFIX}${id}`
}

export function greinSk(id: string): string {
  return `${GREIN_PREFIX}${id}`
}

export function runSk(id: string): string {
  return `${RUN_PREFIX}${id}`
}

export function surtrSk(id: string): string {
  return `${SURTR_PREFIX}${id}`
}

export function idunnSk(id: string): string {
  return `${IDUNN_PREFIX}${id}`
}

/** Composite sort key: SKATT#{runId}#{month}#{year} (mirrors Cairn's CACHE#{markerId}#{month}#{year}). */
export function skattSk(runId: string, month: number | string, year: number | string): string {
  return `${SKATT_PREFIX}${runId}#${month}#${year}`
}

export function sjodrSk(id: string): string {
  return `${SJODR_PREFIX}${id}`
}

export function idFromSk(sk: string, prefix: string): string {
  return sk.startsWith(prefix) ? sk.slice(prefix.length) : sk
}

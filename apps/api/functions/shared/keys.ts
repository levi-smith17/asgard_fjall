/** DynamoDB sort-key prefixes — Asgard greenfield (remap from Cairn on data cutover). */
export const LAUF_PREFIX = 'LAUF#'
export const GREIN_PREFIX = 'GREIN#'
export const RUN_PREFIX = 'RUN#'

export function laufSk(id: string): string {
  return `${LAUF_PREFIX}${id}`
}

export function greinSk(id: string): string {
  return `${GREIN_PREFIX}${id}`
}

export function runSk(id: string): string {
  return `${RUN_PREFIX}${id}`
}

export function idFromSk(sk: string, prefix: string): string {
  return sk.startsWith(prefix) ? sk.slice(prefix.length) : sk
}

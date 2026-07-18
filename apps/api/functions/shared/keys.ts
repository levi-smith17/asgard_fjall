/** DynamoDB sort-key prefixes — Asgard greenfield (remap from Cairn on data cutover). */
export const LAUF_PREFIX = 'LAUF#'
export const GREIN_PREFIX = 'GREIN#'
export const RUN_PREFIX = 'RUN#'
export const SURTR_PREFIX = 'SURTR#'
export const IDUNN_PREFIX = 'IDUNN#'
export const SKATT_PREFIX = 'SKATT#'
export const SJODR_PREFIX = 'SJODR#'
export const SENDIBOD_PREFIX = 'SENDIBOD#'
export const SOGUR_PREFIX = 'SOGUR#'
export const SAGA_PREFIX = 'SAGA#'
export const KIN_PREFIX = 'KIN#'
export const DAGATAL_PREFIX = 'DAGATAL#'
export const DAGATAL_SUB_PREFIX = 'DAGATAL_SUB#'

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

/** Composite sort key: SKATT#{runId}#{month}#{year} (mirrors Cairn's CACHE#{runId}#{month}#{year}). */
export function skattSk(runId: string, month: number | string, year: number | string): string {
  return `${SKATT_PREFIX}${runId}#${month}#${year}`
}

export function sjodrSk(id: string): string {
  return `${SJODR_PREFIX}${id}`
}

export function sendibodSk(id: string): string {
  return `${SENDIBOD_PREFIX}${id}`
}

/** Composite sort key: SENDIBOD#{signalId}#REPLY#{replyId} (mirrors Cairn's SIGNAL#{id}#REPLY#{replyId}). */
export function sendibodReplySk(signalId: string, replyId: string): string {
  return `${SENDIBOD_PREFIX}${signalId}#REPLY#${replyId}`
}

export function sogurSk(id: string): string {
  return `${SOGUR_PREFIX}${id}`
}

export function sagaSk(id: string): string {
  return `${SAGA_PREFIX}${id}`
}

export function kinSk(id: string): string {
  return `${KIN_PREFIX}${id}`
}

export function dagatalSk(id: string): string {
  return `${DAGATAL_PREFIX}${id}`
}

export function dagatalSubSk(id: string): string {
  return `${DAGATAL_SUB_PREFIX}${id}`
}

export function idFromSk(sk: string, prefix: string): string {
  return sk.startsWith(prefix) ? sk.slice(prefix.length) : sk
}

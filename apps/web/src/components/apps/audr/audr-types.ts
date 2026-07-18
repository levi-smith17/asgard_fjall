export type AudrSelection =
  | { kind: 'burn'; id: string }
  | { kind: 'supplyline'; id: string }
  | { kind: 'cache'; id: string }
  | { kind: 'cache-run'; runId: string }
  | { kind: 'new-burn'; runId?: string }
  | { kind: 'new-supplyline' }
  | { kind: 'new-cache'; runId?: string }
  | { kind: 'skatt-carry' }

export type AudrRun = {
  id: string
  name: string
  color: string
  icon?: string | null
}

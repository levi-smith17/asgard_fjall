export type AudrSelection =
  | { kind: 'surtr'; id: string }
  | { kind: 'idunn'; id: string }
  | { kind: 'skatt'; id: string }
  | { kind: 'skatt-run'; runId: string }
  | { kind: 'new-surtr'; runId?: string }
  | { kind: 'new-idunn' }
  | { kind: 'new-skatt'; runId?: string }
  | { kind: 'skatt-carry' }

export type AudrRun = {
  id: string
  name: string
  color: string
  icon?: string | null
}

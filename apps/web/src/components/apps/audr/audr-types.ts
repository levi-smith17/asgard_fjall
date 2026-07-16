export type AudrSelection =
  | { kind: 'burn'; id: string }
  | { kind: 'supplyline'; id: string }
  | { kind: 'cache'; id: string }
  | { kind: 'cache-marker'; markerId: string }
  | { kind: 'new-burn'; markerId?: string }
  | { kind: 'new-supplyline' }
  | { kind: 'new-cache'; markerId?: string }
  | { kind: 'skatt-carry' }

export type AudrMarker = {
  id: string
  name: string
  color: string
  icon?: string | null
}

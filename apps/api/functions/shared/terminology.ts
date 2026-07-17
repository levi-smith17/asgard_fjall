export type DefaultTerminology = 'STANDARD' | 'ASGARD'

export function normalizeDefaultTerminology(value: unknown): DefaultTerminology {
  if (value === 'STANDARD' || value === 'ASGARD') return value
  return 'STANDARD'
}

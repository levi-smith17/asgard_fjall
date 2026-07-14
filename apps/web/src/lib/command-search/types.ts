export type CommandSearchArea =
  | 'Navigation'
  | 'Settings'
  | 'Catalog'
  | 'Journal'
  | 'Manifest'
  | 'Signals'
  | 'Audr'
  | 'Hlidskjalf'

export type CommandSearchEntry = {
  id: string
  label: string
  subtitle?: string
  productPill: string
  areaPill: CommandSearchArea
  path: string
  /** Absolute URL opened with Shift+Enter when present. */
  externalUrl?: string
  keywords: string[]
}

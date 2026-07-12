export type TerminologyStyle = 'ASGARD' | 'CAIRN' | 'STANDARD'

export type Terms = {
  productName: string
  productSubtitle: string
  basecamp: string
  provisions: string
  calendar: string
  messages: string
  resume: string
  notes: string
  starfield: string
  settings: string
}

const ASGARD: Terms = {
  productName: 'Asgard',
  productSubtitle: 'Fjall',
  basecamp: 'Basecamp',
  provisions: 'Audr',
  calendar: 'Dagatal',
  messages: 'Sendibod',
  resume: 'Ordstirr',
  notes: 'Sogur',
  starfield: 'Stjornur',
  settings: 'Thing',
}

const CAIRN: Terms = {
  productName: 'Cairn',
  productSubtitle: 'Fjall',
  basecamp: 'Basecamp',
  provisions: 'Provisions',
  calendar: 'Itinerary',
  messages: 'Signals',
  resume: 'Manifest',
  notes: 'Logbooks',
  starfield: 'Starfield',
  settings: 'Settings',
}

const STANDARD: Terms = {
  productName: 'Asgard',
  productSubtitle: 'Fjall',
  basecamp: 'Home',
  provisions: 'Finance',
  calendar: 'Calendar',
  messages: 'Messages',
  resume: 'Resume',
  notes: 'Notes',
  starfield: 'Planner',
  settings: 'Settings',
}

const STORAGE_KEY = 'fjall_terminology_style'

export function loadTerminologyStyle(): TerminologyStyle {
  const raw = localStorage.getItem(STORAGE_KEY)
  if (raw === 'CAIRN' || raw === 'STANDARD' || raw === 'ASGARD') return raw
  return 'ASGARD'
}

export function saveTerminologyStyle(style: TerminologyStyle) {
  localStorage.setItem(STORAGE_KEY, style)
}

export function termsFor(style: TerminologyStyle): Terms {
  switch (style) {
    case 'CAIRN':
      return CAIRN
    case 'STANDARD':
      return STANDARD
    default:
      return ASGARD
  }
}

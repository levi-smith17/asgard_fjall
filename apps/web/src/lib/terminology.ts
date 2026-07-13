export type TerminologyStyle = 'ASGARD' | 'CAIRN' | 'STANDARD'

export type Terms = {
  productName: string
  productSubtitle: string
  dashboard: string
  provisions: string
  calendar: string
  messages: string
  resume: string
  notes: string
  notesSingular: string
  starfield: string
  settings: string
  account: string
  privacy: string
  /** Cairn catalog write-through cache (not Audr budgets, not Dagatal). */
  cache: string
  // Audr (provisions) item types
  expenses: string
  expenseSingular: string
  subscriptions: string
  subscriptionSingular: string
  budgets: string
  budgetSingular: string
  // Cairn item types
  laufar: string
  laufarSingular: string
  greinar: string
  greinSingular: string
  runir: string
  runSingular: string
  spjald: string
  spjold: string
  // Ordstirr / manifest fields
  manifest: string
  origins: string
  expeditions: string
  training: string
  gear: string
  landmarks: string
  summits: string
  pathfinding: string
  summary: string
  headline: string
  location: string
  bio: string
  bio_button: string
  companions: string
  summit_reached: string
}

const ASGARD: Terms = {
  productName: 'Asgard',
  productSubtitle: 'Fjall',
  dashboard: 'Hlidskjalf',
  provisions: 'Audr',
  calendar: 'Dagatal',
  messages: 'Sendibod',
  resume: 'Ordstirr',
  notes: 'Sögur',
  notesSingular: 'Saga',
  starfield: 'Stjörnur',
  settings: 'Thing',
  account: 'Heiti',
  privacy: 'Frid',
  cache: 'Fordi',
  expenses: 'Surtr',
  expenseSingular: 'Surtr',
  subscriptions: 'Idunn',
  subscriptionSingular: 'Idunn',
  budgets: 'Skatt',
  budgetSingular: 'Skatt',
  laufar: 'Laufar',
  laufarSingular: 'Lauf',
  greinar: 'Greinar',
  greinSingular: 'Grein',
  runir: 'Runir',
  runSingular: 'Run',
  spjald: 'Spjald',
  spjold: 'Spjold',
  manifest: 'Ordstirr',
  origins: 'Rót',
  expeditions: 'Leidangr',
  training: 'Thjalfun',
  gear: 'Bunadr',
  landmarks: 'Vördur',
  summits: 'Tindar',
  pathfinding: 'Lidsinni',
  summary: 'Summary',
  headline: 'Headline',
  location: 'Location',
  bio: 'Sjalfsmynd',
  bio_button: 'Ferd Min',
  companions: 'Foruneyti',
  summit_reached: 'Bautasteinn',
}

const CAIRN: Terms = {
  productName: 'Cairn',
  productSubtitle: 'Fjall',
  dashboard: 'Basecamp',
  provisions: 'Provisions',
  calendar: 'Itinerary',
  messages: 'Signals',
  resume: 'Manifest',
  notes: 'Logbooks',
  notesSingular: 'Log',
  starfield: 'Starfield',
  settings: 'Settings',
  account: 'Trail Register',
  privacy: 'Solitude',
  cache: 'Resupply',
  expenses: 'Burn',
  expenseSingular: 'Burn',
  subscriptions: 'Supplylines',
  subscriptionSingular: 'Supplyline',
  budgets: 'Cache',
  budgetSingular: 'Cache',
  laufar: 'Waypoints',
  laufarSingular: 'Waypoint',
  greinar: 'Trails',
  greinSingular: 'Trail',
  runir: 'Markers',
  runSingular: 'Marker',
  spjald: 'Tile',
  spjold: 'Tiles',
  manifest: 'Manifest',
  origins: 'Origins',
  expeditions: 'Expeditions',
  training: 'Training',
  gear: 'Gear',
  landmarks: 'Landmarks',
  summits: 'Summits',
  pathfinding: 'Pathfinding',
  summary: 'Summary',
  headline: 'Headline',
  location: 'Location',
  bio: 'Field Notes',
  bio_button: 'My Journey',
  companions: 'Companions',
  summit_reached: 'Summit Reached',
}

const STANDARD: Terms = {
  productName: 'Asgard',
  productSubtitle: 'Fjall',
  dashboard: 'Dashboard',
  provisions: 'Finance',
  calendar: 'Calendar',
  messages: 'Messages',
  resume: 'Resume',
  notes: 'Notes',
  notesSingular: 'Note',
  starfield: 'Starfield',
  settings: 'Settings',
  account: 'Account',
  privacy: 'Privacy',
  cache: 'Cache',
  expenses: 'Expenses',
  expenseSingular: 'Expense',
  subscriptions: 'Subscriptions',
  subscriptionSingular: 'Subscription',
  budgets: 'Budgets',
  budgetSingular: 'Budget',
  laufar: 'Tasks',
  laufarSingular: 'Task',
  greinar: 'Groups',
  greinSingular: 'Group',
  runir: 'Tags',
  runSingular: 'Tag',
  spjald: 'Tile',
  spjold: 'Tiles',
  manifest: 'Resume',
  origins: 'About',
  expeditions: 'Work Experience',
  training: 'Education',
  gear: 'Skills',
  landmarks: 'Projects',
  summits: 'Achievements',
  pathfinding: 'Volunteering',
  summary: 'Summary',
  headline: 'Title',
  location: 'Location',
  bio: 'Bio',
  bio_button: 'More About Me',
  companions: 'Pets',
  summit_reached: 'In Memoriam',
}

const STORAGE_KEY = 'fjall_terminology_style'

export function loadTerminologyStyle(): TerminologyStyle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw === 'CAIRN' || raw === 'STANDARD' || raw === 'ASGARD') return raw
  } catch {
    // ignore
  }
  return 'ASGARD'
}

export function saveTerminologyStyle(style: TerminologyStyle) {
  try {
    localStorage.setItem(STORAGE_KEY, style)
  } catch {
    // ignore
  }
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

export function nextTerminologyStyle(current: TerminologyStyle): TerminologyStyle {
  if (current === 'STANDARD') return 'CAIRN'
  if (current === 'CAIRN') return 'ASGARD'
  return 'STANDARD'
}

export function terminologyToggleTooltip(current: TerminologyStyle): string {
  const next = nextTerminologyStyle(current)
  if (next === 'STANDARD') return 'Switch to Standard terms'
  if (next === 'CAIRN') return 'Switch to Cairn terms'
  return 'Switch to Asgard terms'
}

export type ManifestTerms = Pick<
  Terms,
  | 'manifest'
  | 'origins'
  | 'expeditions'
  | 'training'
  | 'gear'
  | 'landmarks'
  | 'summits'
  | 'pathfinding'
  | 'summary'
  | 'headline'
  | 'location'
  | 'bio'
  | 'bio_button'
  | 'companions'
  | 'summit_reached'
>

export function getManifestTerms(style: TerminologyStyle): ManifestTerms {
  const terms = termsFor(style)
  return {
    manifest: terms.manifest,
    origins: terms.origins,
    expeditions: terms.expeditions,
    training: terms.training,
    gear: terms.gear,
    landmarks: terms.landmarks,
    summits: terms.summits,
    pathfinding: terms.pathfinding,
    summary: terms.summary,
    headline: terms.headline,
    location: terms.location,
    bio: terms.bio,
    bio_button: terms.bio_button,
    companions: terms.companions,
    summit_reached: terms.summit_reached,
  }
}

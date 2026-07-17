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
  /** Nidjatal — genealogy app (Asgard: Nidjatal). */
  nidjatal: string
  nidjatalPerson: string
  nidjatalPersonPlural: string
  /** Lattic Forge — external app (Asgard: Völundr). */
  forge: string
  settings: string
  account: string
  privacy: string
  /** Cairn catalog write-through cache (not Audr budgets, not Dagatal). */
  cache: string
  /** Sidebar group: Platform / Pallr. */
  platformGroup: string
  /** Overview (Yfirlit) — Hlidskjalf. */
  overviewGroup: string
  /** Personal (Sjálfr). */
  fjallPersonalGroup: string
  /** Extras (Fleira). */
  fjallExtrasGroup: string
  /** Sidebar group: Public View / Almenningr. */
  publicViewGroup: string
  // Audr (provisions) item types
  expenses: string
  expenseSingular: string
  subscriptions: string
  subscriptionSingular: string
  budgets: string
  budgetSingular: string
  /** Root Run/Marker name for Audr scoping (data root path). */
  provisionsGroup: string
  /** Audr funds (Asgard: Sjodr). */
  sjodr: string
  sjodrSingular: string
  // Cairn item types
  laufar: string
  laufarSingular: string
  greinar: string
  greinSingular: string
  runir: string
  runSingular: string
  spjald: string
  spjold: string
  unassigned: string
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
  contact: string
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
  nidjatal: 'Nidjatal',
  nidjatalPerson: 'Ættingi',
  nidjatalPersonPlural: 'Ættingjar',
  forge: 'Völundr',
  settings: 'Thing',
  account: 'Heiti',
  privacy: 'Frid',
  cache: 'Fordi',
  platformGroup: 'Pallr',
  overviewGroup: 'Yfirlit',
  fjallPersonalGroup: 'Sjálfr',
  fjallExtrasGroup: 'Fleira',
  publicViewGroup: 'Almenningr',
  expenses: 'Surtr',
  expenseSingular: 'Surtr',
  subscriptions: 'Idunn',
  subscriptionSingular: 'Idunn',
  budgets: 'Skatt',
  budgetSingular: 'Skatt',
  provisionsGroup: 'Audr',
  sjodr: 'Sjodr',
  sjodrSingular: 'Sjodr',
  laufar: 'Laufar',
  laufarSingular: 'Lauf',
  greinar: 'Greinar',
  greinSingular: 'Grein',
  runir: 'Rúnir',
  runSingular: 'Rún',
  spjald: 'Spjald',
  spjold: 'Spjold',
  unassigned: 'Oflokkad',
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
  contact: 'Ordsending',
  companions: 'Foruneyti',
  summit_reached: 'Bautasteinn',
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
  nidjatal: 'Genealogy',
  nidjatalPerson: 'Person',
  nidjatalPersonPlural: 'People',
  forge: 'Lattic Forge',
  settings: 'Settings',
  account: 'Account',
  privacy: 'Privacy',
  cache: 'Cache',
  platformGroup: 'Platform',
  overviewGroup: 'Overview',
  fjallPersonalGroup: 'Personal',
  fjallExtrasGroup: 'Extras',
  publicViewGroup: 'Public View',
  expenses: 'Expenses',
  expenseSingular: 'Expense',
  subscriptions: 'Subscriptions',
  subscriptionSingular: 'Subscription',
  budgets: 'Budgets',
  budgetSingular: 'Budget',
  provisionsGroup: 'Audr',
  sjodr: 'Funds',
  sjodrSingular: 'Fund',
  laufar: 'Tasks',
  laufarSingular: 'Task',
  greinar: 'Groups',
  greinSingular: 'Group',
  runir: 'Tags',
  runSingular: 'Tag',
  spjald: 'Tile',
  spjold: 'Tiles',
  unassigned: 'Unassigned',
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
  contact: 'Contact',
  companions: 'Pets',
  summit_reached: 'In Memoriam',
}

const STORAGE_KEY = 'fjall_terminology_style'

export function loadTerminologyStyle(): TerminologyStyle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    // Cairn style removed from Fjall UI — map legacy preference to Standard.
    if (raw === 'CAIRN') return 'STANDARD'
    if (raw === 'STANDARD' || raw === 'ASGARD') return raw
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
    case 'STANDARD':
      return STANDARD
    case 'CAIRN':
      // Legacy: treat as Standard on Fjall (Cairn pack not user-facing).
      return STANDARD
    default:
      return ASGARD
  }
}

/** Public UI cycles Standard ↔ Asgard only. */
export function nextTerminologyStyle(current: TerminologyStyle): TerminologyStyle {
  if (current === 'STANDARD') return 'ASGARD'
  return 'STANDARD'
}

export function terminologyToggleTooltip(current: TerminologyStyle): string {
  const next = nextTerminologyStyle(current)
  if (next === 'STANDARD') return 'Switch to Standard terms'
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
  | 'contact'
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
    contact: terms.contact,
    companions: terms.companions,
    summit_reached: terms.summit_reached,
  }
}

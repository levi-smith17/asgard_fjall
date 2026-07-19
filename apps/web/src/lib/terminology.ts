export type TerminologyStyle = 'STANDARD' | 'ASGARD'

export type Terms = {
  productName: string
  productSubtitle: string
  dashboard: string
  audr: string
  calendar: string
  messages: string
  resume: string
  /** Sogur containers: Sögur/Saga or Notebooks/Notebook. */
  notes: string
  notesSingular: string
  /** Sogur content units: Thaettir/Thattr or Notes/Note. */
  thaettir: string
  thattrSingular: string
  stjornur: string
  /** Nidjatal — genealogy app (Asgard: Nidjatal). */
  nidjatal: string
  nidjatalPerson: string
  nidjatalPersonPlural: string
  /** Lattic Forge — external app (Asgard: Völundr). */
  forge: string
  settings: string
  account: string
  privacy: string
  /** Fjall catalog write-through cache (not Audr skatt, not Dagatal). */
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
  /** Color palette: Green / Graenn. */
  paletteGreen: string
  /** Color palette: Gold / Gull. */
  paletteGold: string
  // Audr (audr) item types
  surtr: string
  surtrSingular: string
  idunn: string
  idunnSingular: string
  skatt: string
  skattSingular: string
  /** Root Run/Run name for Audr scoping (data root path). */
  audrGroup: string
  /** Audr funds (Asgard: Sjodr). */
  sjodr: string
  sjodrSingular: string
  // Fjall item types
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
  audr: 'Audr',
  calendar: 'Dagatal',
  messages: 'Sendibod',
  resume: 'Ordstirr',
  notes: 'Sögur',
  notesSingular: 'Saga',
  thaettir: 'Thaettir',
  thattrSingular: 'Thattr',
  stjornur: 'Stjörnur',
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
  paletteGreen: 'Graenn',
  paletteGold: 'Gull',
  surtr: 'Surtr',
  surtrSingular: 'Surtr',
  idunn: 'Idunn',
  idunnSingular: 'Idunn',
  skatt: 'Skatt',
  skattSingular: 'Skatt',
  audrGroup: 'Audr',
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
  audr: 'Finance',
  calendar: 'Calendar',
  messages: 'Messages',
  resume: 'Profile',
  notes: 'Notebooks',
  notesSingular: 'Notebook',
  thaettir: 'Notes',
  thattrSingular: 'Note',
  stjornur: 'Starfield',
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
  paletteGreen: 'Green',
  paletteGold: 'Gold',
  surtr: 'Expenses',
  surtrSingular: 'Expense',
  idunn: 'Subscriptions',
  idunnSingular: 'Subscription',
  skatt: 'Budgets',
  skattSingular: 'Budget',
  audrGroup: 'Audr',
  sjodr: 'Funds',
  sjodrSingular: 'Fund',
  laufar: 'Bookmarks',
  laufarSingular: 'Bookmark',
  greinar: 'Folders',
  greinSingular: 'Folder',
  runir: 'Tags',
  runSingular: 'Tag',
  spjald: 'Tile',
  spjold: 'Tiles',
  unassigned: 'Unassigned',
  manifest: 'Profile',
  origins: 'Intro',
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

export function normalizeTerminologyStyle(stored: string | null | undefined): TerminologyStyle {
  if (stored === 'STANDARD' || stored === 'ASGARD') return stored
  return 'ASGARD'
}

export function loadTerminologyStyle(): TerminologyStyle {
  try {
    return normalizeTerminologyStyle(localStorage.getItem(STORAGE_KEY))
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
  if (style === 'STANDARD') return STANDARD
  return ASGARD
}

/** Public UI cycles Standard ↔ Asgard only. */
export function nextTerminologyStyle(current: TerminologyStyle): TerminologyStyle {
  if (current === 'STANDARD') return 'ASGARD'
  return 'STANDARD'
}

export function terminologyToggleTooltip(current: TerminologyStyle): string {
  const next = nextTerminologyStyle(current)
  if (next === 'STANDARD') return 'Standard Idord'
  return 'Asgard Terms'
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

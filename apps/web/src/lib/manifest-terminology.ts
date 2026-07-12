export type ManifestTerms = {
  manifest: string
  origins: string
  expeditions: string
  training: string
  gear: string
  landmarks: string
  summits: string
  pathfinding: string
  companions: string
  bio: string
  bio_button: string
  summary: string
  headline: string
  location: string
  summit_reached: string
}

export type ManifestTerminologyStyle = 'cairn' | 'standard'

const CAIRN_TERMS: ManifestTerms = {
  manifest: 'Manifest',
  origins: 'Origins',
  expeditions: 'Expeditions',
  training: 'Training',
  gear: 'Gear',
  landmarks: 'Landmarks',
  summits: 'Summits',
  pathfinding: 'Pathfinding',
  companions: 'Companions',
  bio: 'Field Notes',
  bio_button: 'My Journey',
  summary: 'Summary',
  headline: 'Headline',
  location: 'Location',
  summit_reached: 'Summit Reached',
}

const STANDARD_TERMS: ManifestTerms = {
  manifest: 'Resume',
  origins: 'About',
  expeditions: 'Work Experience',
  training: 'Education',
  gear: 'Skills',
  landmarks: 'Projects',
  summits: 'Achievements',
  pathfinding: 'Volunteering',
  companions: 'Pets',
  bio: 'Bio',
  bio_button: 'More About Me',
  summary: 'Summary',
  headline: 'Title',
  location: 'Location',
  summit_reached: 'In Memoriam',
}

export function getManifestTerms(style?: ManifestTerminologyStyle | string): ManifestTerms {
  if (style === 'standard' || style === 'STANDARD') return STANDARD_TERMS
  return CAIRN_TERMS
}

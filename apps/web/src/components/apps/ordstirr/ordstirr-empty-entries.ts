import type {
  ManifestCompanion,
  ManifestExpedition,
  ManifestGear,
  ManifestLandmark,
  ManifestPathfinding,
  ManifestSummit,
  ManifestTraining,
} from '@/lib/manifest-api'
import { todayMonthStartInputValue } from '@/lib/date-input'
import type { OrdstirrJourneySectionId, OrdstirrSectionId } from '@/lib/ordstirr-format'
import { createDraftId } from './ordstirr-manifest-list-inspector'

export { createDraftId }

export const MANIFEST_ADD_SECTIONS: OrdstirrSectionId[] = [
  'expeditions',
  'training',
  'gear',
  'landmarks',
  'summits',
  'pathfinding',
]

export const JOURNEY_ADD_SECTIONS: OrdstirrJourneySectionId[] = ['companions', 'in-memoriam']

export function isDraftEntryId(id: string) {
  return id.startsWith('draft-')
}

export function createEmptyExpedition(id: string): ManifestExpedition {
  return {
    id,
    title: '',
    company: '',
    location: null,
    startDate: todayMonthStartInputValue(),
    endDate: null,
    current: false,
    description: null,
  }
}

export function createEmptyTraining(id: string): ManifestTraining {
  return {
    id,
    institution: '',
    degree: null,
    field: null,
    startDate: todayMonthStartInputValue(),
    endDate: null,
    current: false,
    description: null,
  }
}

export function createEmptyGear(id: string): ManifestGear {
  return {
    id,
    name: '',
    category: null,
    level: null,
  }
}

export function createEmptyLandmark(id: string): ManifestLandmark {
  return {
    id,
    name: '',
    description: null,
    url: null,
    githubUrl: null,
    startDate: null,
    endDate: null,
    current: false,
  }
}

export function createEmptySummit(id: string): ManifestSummit {
  return {
    id,
    title: '',
    issuer: null,
    date: null,
    description: null,
    url: null,
  }
}

export function createEmptyPathfinding(id: string): ManifestPathfinding {
  return {
    id,
    organization: '',
    role: null,
    location: null,
    startDate: todayMonthStartInputValue(),
    endDate: null,
    current: false,
    description: null,
  }
}

export function createEmptyCompanion(id: string, passed = false): ManifestCompanion {
  return {
    id,
    name: '',
    species: '',
    breed: null,
    birthday: null,
    bio: null,
    passed,
    media: [],
  }
}

export function createEmptyManifestEntry(
  sectionId: OrdstirrSectionId,
  id: string = createDraftId(),
): { sectionId: OrdstirrSectionId; entry: unknown } {
  switch (sectionId) {
    case 'expeditions':
      return { sectionId, entry: createEmptyExpedition(id) }
    case 'training':
      return { sectionId, entry: createEmptyTraining(id) }
    case 'gear':
      return { sectionId, entry: createEmptyGear(id) }
    case 'landmarks':
      return { sectionId, entry: createEmptyLandmark(id) }
    case 'summits':
      return { sectionId, entry: createEmptySummit(id) }
    case 'pathfinding':
      return { sectionId, entry: createEmptyPathfinding(id) }
    default:
      throw new Error(`Section ${sectionId} does not support add`)
  }
}

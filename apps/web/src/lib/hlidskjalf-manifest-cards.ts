import type { ManifestData } from '@/lib/manifest-api'
import type { ManifestTerms } from '@/lib/terminology'

export type ManifestSectionTermKey = Extract<
  keyof ManifestTerms,
  'expeditions' | 'training' | 'gear' | 'landmarks' | 'summits' | 'pathfinding' | 'companions'
>

export type ManifestSectionCard = {
  id: ManifestSectionTermKey
  termKey: ManifestSectionTermKey
  count: number
  summary: string | null
}

export function buildManifestHighlights(manifest: ManifestData) {
  const sortedExpeditions = [...manifest.expeditions].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )
  const mostRecentExpedition = sortedExpeditions[0]
    ? { title: sortedExpeditions[0].title, company: sortedExpeditions[0].company }
    : null

  const sortedTraining = [...manifest.training].sort(
    (a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
  )
  const mostRecentTraining = sortedTraining[0]
    ? {
        institution: sortedTraining[0].institution,
        degree: sortedTraining[0].degree ?? null,
      }
    : null

  let totalYearsExperience = 0
  for (const exp of manifest.expeditions) {
    const start = new Date(exp.startDate)
    const end = exp.endDate ? new Date(exp.endDate) : new Date()
    totalYearsExperience += (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
  }

  const topGear = manifest.gear.slice(0, 5).map((g) => ({ name: g.name }))
  const mostRecentLandmark = manifest.landmarks[0]
    ? { name: manifest.landmarks[0].name }
    : null
  const mostRecentSummit = manifest.summits[0]
    ? { name: manifest.summits[0].title }
    : null
  const mostRecentPathfinding = manifest.pathfinding[0]
    ? {
        organization: manifest.pathfinding[0].organization ?? null,
        role: manifest.pathfinding[0].role ?? null,
      }
    : null
  const mostRecentCompanion = manifest.companions[0]
    ? { name: manifest.companions[0].name }
    : null

  return {
    totalYearsExperience: Math.round(totalYearsExperience),
    mostRecentExpedition,
    mostRecentTraining,
    topGear,
    mostRecentLandmark,
    mostRecentSummit,
    mostRecentPathfinding,
    mostRecentCompanion,
  }
}

/** Summit-style manifest section cards with highlight summaries. */
export function buildManifestSectionCards(manifest: ManifestData): ManifestSectionCard[] {
  const highlights = buildManifestHighlights(manifest)
  return [
    {
      id: 'expeditions',
      termKey: 'expeditions',
      count: manifest.expeditions.length,
      summary: highlights.mostRecentExpedition
        ? `${highlights.mostRecentExpedition.title} · ${highlights.mostRecentExpedition.company}`
        : highlights.totalYearsExperience > 0
          ? `${highlights.totalYearsExperience} yrs experience`
          : null,
    },
    {
      id: 'training',
      termKey: 'training',
      count: manifest.training.length,
      summary: highlights.mostRecentTraining
        ? highlights.mostRecentTraining.degree
          ? `${highlights.mostRecentTraining.degree} · ${highlights.mostRecentTraining.institution}`
          : highlights.mostRecentTraining.institution
        : null,
    },
    {
      id: 'gear',
      termKey: 'gear',
      count: manifest.gear.length,
      summary:
        highlights.topGear.length > 0
          ? highlights.topGear.map((g) => g.name).join(', ')
          : null,
    },
    {
      id: 'landmarks',
      termKey: 'landmarks',
      count: manifest.landmarks.length,
      summary: highlights.mostRecentLandmark?.name ?? null,
    },
    {
      id: 'summits',
      termKey: 'summits',
      count: manifest.summits.length,
      summary: highlights.mostRecentSummit?.name ?? null,
    },
    {
      id: 'pathfinding',
      termKey: 'pathfinding',
      count: manifest.pathfinding.length,
      summary: highlights.mostRecentPathfinding
        ? [highlights.mostRecentPathfinding.role, highlights.mostRecentPathfinding.organization]
            .filter(Boolean)
            .join(' · ') || null
        : null,
    },
    {
      id: 'companions',
      termKey: 'companions',
      count: manifest.companions.length,
      summary: highlights.mostRecentCompanion?.name ?? null,
    },
  ]
}

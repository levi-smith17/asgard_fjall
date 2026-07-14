import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Backpack,
  Briefcase,
  Compass,
  Flag,
  GraduationCap,
  Mail,
  MapPin,
  PawPrint,
  ScrollText,
} from 'lucide-react'
import type { PublicJourneyData, PublicManifestData } from '@/lib/manifest-public-api'
import type { PublicManifestView } from '@/lib/public-manifest-path'
import type { Terms } from '@/lib/terminology'

export type PublicOrdstirrRailSectionId =
  | 'origins'
  | 'expeditions'
  | 'training'
  | 'gear'
  | 'landmarks'
  | 'summits'
  | 'pathfinding'
  | 'bio'
  | 'companions'
  | 'in-memoriam'
  | 'ordsending'

export type PublicOrdstirrRailSection = {
  id: PublicOrdstirrRailSectionId
  label: string
  icon: LucideIcon
  view: PublicManifestView
  count: number | null
}

const MANIFEST_SECTION_META: Array<{
  id: Extract<
    PublicOrdstirrRailSectionId,
    'origins' | 'expeditions' | 'training' | 'gear' | 'landmarks' | 'summits' | 'pathfinding'
  >
  icon: LucideIcon
  termKey: keyof Terms
}> = [
  { id: 'origins', icon: MapPin, termKey: 'origins' },
  { id: 'expeditions', icon: Briefcase, termKey: 'expeditions' },
  { id: 'training', icon: GraduationCap, termKey: 'training' },
  { id: 'gear', icon: Backpack, termKey: 'gear' },
  { id: 'landmarks', icon: Flag, termKey: 'landmarks' },
  { id: 'summits', icon: Award, termKey: 'summits' },
  { id: 'pathfinding', icon: Compass, termKey: 'pathfinding' },
]

/** Ordered rail covering Ordstirr → Ferd Min → Ordsending. */
export function buildPublicOrdstirrRailSections(
  terms: Terms,
  manifest: PublicManifestData | null | undefined,
  journey: PublicJourneyData | null | undefined,
): PublicOrdstirrRailSection[] {
  const living = (journey?.companions ?? []).filter((companion) => !companion.passed)
  const memorial = (journey?.companions ?? []).filter((companion) => Boolean(companion.passed))

  const manifestCounts: Record<
    Extract<
      PublicOrdstirrRailSectionId,
      'origins' | 'expeditions' | 'training' | 'gear' | 'landmarks' | 'summits' | 'pathfinding'
    >,
    number | null
  > = {
    origins: null,
    expeditions: manifest?.expeditions.length ?? null,
    training: manifest?.training.length ?? null,
    gear: manifest?.gear.length ?? null,
    landmarks: manifest?.landmarks.length ?? null,
    summits: manifest?.summits.length ?? null,
    pathfinding: manifest?.pathfinding.length ?? null,
  }

  const manifestSections = MANIFEST_SECTION_META.map((section) => ({
    id: section.id,
    label: String(terms[section.termKey]),
    icon: section.icon,
    view: 'manifest' as const,
    count: manifestCounts[section.id],
  }))

  const journeySections: PublicOrdstirrRailSection[] = [
    {
      id: 'bio',
      label: terms.bio,
      icon: ScrollText,
      view: 'journey',
      count: null,
    },
    {
      id: 'companions',
      label: terms.companions,
      icon: PawPrint,
      view: 'journey',
      count: living.length || null,
    },
    {
      id: 'in-memoriam',
      label: terms.summit_reached,
      icon: Award,
      view: 'journey',
      count: memorial.length || null,
    },
  ]

  const contactSection: PublicOrdstirrRailSection = {
    id: 'ordsending',
    label: terms.contact,
    icon: Mail,
    view: 'contact',
    count: null,
  }

  return [...manifestSections, ...journeySections, contactSection]
}

export function viewForPublicRailSection(
  sectionId: PublicOrdstirrRailSectionId,
): PublicManifestView {
  if (sectionId === 'ordsending') return 'contact'
  if (sectionId === 'bio' || sectionId === 'companions' || sectionId === 'in-memoriam') {
    return 'journey'
  }
  return 'manifest'
}

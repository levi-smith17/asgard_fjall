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
  /** URL hash slug (Standard English terms). */
  hash: string
}

export type PublicOrdstirrRailGroup = {
  id: PublicManifestView
  label: string
  sections: PublicOrdstirrRailSection[]
}

/** Public URL hashes always use Standard English slugs (never Asgard/Cairn terms). */
export const PUBLIC_SECTION_HASH_BY_ID: Record<PublicOrdstirrRailSectionId, string> = {
  origins: 'intro',
  expeditions: 'work-experience',
  training: 'education',
  gear: 'skills',
  landmarks: 'projects',
  summits: 'achievements',
  pathfinding: 'volunteering',
  bio: 'bio',
  companions: 'pets',
  'in-memoriam': 'in-memoriam',
  ordsending: 'contact',
}

/** Legacy internal ids + Standard slugs both resolve for deep links. */
const HASH_ALIASES: Record<string, PublicOrdstirrRailSectionId> = {
  ...Object.fromEntries(
    (Object.entries(PUBLIC_SECTION_HASH_BY_ID) as Array<[PublicOrdstirrRailSectionId, string]>).map(
      ([id, hash]) => [hash, id],
    ),
  ),
  origins: 'origins',
  expeditions: 'expeditions',
  training: 'training',
  gear: 'gear',
  landmarks: 'landmarks',
  summits: 'summits',
  pathfinding: 'pathfinding',
  bio: 'bio',
  companions: 'companions',
  'in-memoriam': 'in-memoriam',
  ordsending: 'ordsending',
  about: 'origins',
  intro: 'origins',
  contact: 'ordsending',
}

export function publicSectionHash(sectionId: PublicOrdstirrRailSectionId): string {
  return PUBLIC_SECTION_HASH_BY_ID[sectionId]
}

export function sectionIdFromPublicHash(hash: string): PublicOrdstirrRailSectionId | null {
  const key = hash.replace(/^#/, '').trim().toLowerCase()
  if (!key) return null
  return HASH_ALIASES[key] ?? null
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

/** Ordered rail groups: Ordstirr → Ferd Min → Ordsending. */
export function buildPublicOrdstirrRailGroups(terms: Terms): PublicOrdstirrRailGroup[] {
  return [
    {
      id: 'manifest',
      label: terms.manifest,
      sections: MANIFEST_SECTION_META.map((section) => ({
        id: section.id,
        label: String(terms[section.termKey]),
        icon: section.icon,
        view: 'manifest' as const,
        hash: PUBLIC_SECTION_HASH_BY_ID[section.id],
      })),
    },
    {
      id: 'journey',
      label: terms.bio_button,
      sections: [
        {
          id: 'bio',
          label: terms.bio,
          icon: ScrollText,
          view: 'journey',
          hash: PUBLIC_SECTION_HASH_BY_ID.bio,
        },
        {
          id: 'companions',
          label: terms.companions,
          icon: PawPrint,
          view: 'journey',
          hash: PUBLIC_SECTION_HASH_BY_ID.companions,
        },
        {
          id: 'in-memoriam',
          label: terms.summit_reached,
          icon: Award,
          view: 'journey',
          hash: PUBLIC_SECTION_HASH_BY_ID['in-memoriam'],
        },
      ],
    },
    {
      id: 'contact',
      label: terms.contact,
      sections: [
        {
          id: 'ordsending',
          label: terms.contact,
          icon: Mail,
          view: 'contact',
          hash: PUBLIC_SECTION_HASH_BY_ID.ordsending,
        },
      ],
    },
  ]
}

export function viewForPublicRailSection(
  sectionId: PublicOrdstirrRailSectionId,
): PublicManifestView {
  if (sectionId === 'ordsending') return 'contact'
  if (sectionId === 'companions' || sectionId === 'in-memoriam' || sectionId === 'bio') {
    return 'journey'
  }
  return 'manifest'
}

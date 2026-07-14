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
}

export type PublicOrdstirrRailGroup = {
  id: PublicManifestView
  label: string
  sections: PublicOrdstirrRailSection[]
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
      })),
    },
    {
      id: 'journey',
      label: terms.bio_button,
      sections: [
        { id: 'bio', label: terms.bio, icon: ScrollText, view: 'journey' },
        { id: 'companions', label: terms.companions, icon: PawPrint, view: 'journey' },
        { id: 'in-memoriam', label: terms.summit_reached, icon: Award, view: 'journey' },
      ],
    },
    {
      id: 'contact',
      label: terms.contact,
      sections: [
        { id: 'ordsending', label: terms.contact, icon: Mail, view: 'contact' },
      ],
    },
  ]
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

import type { LucideIcon } from 'lucide-react'
import { Award, Backpack, Briefcase, Compass, Flag, GraduationCap, MapPin, PawPrint, ScrollText } from 'lucide-react'
import type { ManifestTerms } from '@/lib/manifest-terminology'
import type { ManifestData } from '@/lib/manifest-api'

export type OrdstirrSectionId =
  | 'origins'
  | 'expeditions'
  | 'training'
  | 'gear'
  | 'landmarks'
  | 'summits'
  | 'pathfinding'

export type OrdstirrJourneySectionId = 'bio' | 'companions' | 'in-memoriam'

export type OrdstirrCanvasView = 'manifest' | 'journey'

export type OrdstirrSection = {
  id: OrdstirrSectionId
  label: string
  icon: LucideIcon
  count: number | null
}

export type OrdstirrJourneySection = {
  id: OrdstirrJourneySectionId
  label: string
  icon: LucideIcon
  count: number | null
}

const SECTION_META: Array<{ id: OrdstirrSectionId; icon: LucideIcon; termKey: keyof ManifestTerms }> = [
  { id: 'origins', icon: MapPin, termKey: 'origins' },
  { id: 'expeditions', icon: Briefcase, termKey: 'expeditions' },
  { id: 'training', icon: GraduationCap, termKey: 'training' },
  { id: 'gear', icon: Backpack, termKey: 'gear' },
  { id: 'landmarks', icon: Flag, termKey: 'landmarks' },
  { id: 'summits', icon: Award, termKey: 'summits' },
  { id: 'pathfinding', icon: Compass, termKey: 'pathfinding' },
]

export function manifestSectionCounts(data: ManifestData): Record<OrdstirrSectionId, number | null> {
  return {
    origins: null,
    expeditions: data.expeditions.length,
    training: data.training.length,
    gear: data.gear.length,
    landmarks: data.landmarks.length,
    summits: data.summits.length,
    pathfinding: data.pathfinding.length,
  }
}

export function buildOrdstirrSections(data: ManifestData, terms: ManifestTerms): OrdstirrSection[] {
  const counts = manifestSectionCounts(data)
  return SECTION_META.map((section) => ({
    id: section.id,
    icon: section.icon,
    label: terms[section.termKey],
    count: counts[section.id],
  }))
}

export function buildJourneySections(data: ManifestData, terms: ManifestTerms): OrdstirrJourneySection[] {
  const active = data.companions.filter((c) => !c.passed)
  const passed = data.companions.filter((c) => c.passed)
  return [
    { id: 'bio', label: terms.bio, icon: ScrollText, count: null },
    { id: 'companions', label: terms.companions, icon: PawPrint, count: active.length || null },
    { id: 'in-memoriam', label: terms.summit_reached, icon: Award, count: passed.length || null },
  ]
}

export function manifestPublicUrl(username: string | null | undefined, customDomain?: string | null): string | null {
  const domain = customDomain?.trim()
  if (domain) return domain.startsWith('http') ? domain : `https://${domain}`
  if (username?.trim()) return `https://cairn.ing/manifest/${username.trim()}`
  return null
}

export function manifestPublicJourneyUrl(username: string | null | undefined, customDomain?: string | null): string | null {
  const manifest = manifestPublicUrl(username, customDomain)
  if (!manifest) return null
  if (customDomain?.trim()) return `${manifest.replace(/\/$/, '')}/journey`
  return `${manifest}/journey`
}

export function formatManifestMonth(date: string | Date | null | undefined): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })
}

export function formatManifestDate(date: string | Date | null | undefined): string {
  if (!date) return ''
  const parsed = new Date(date)
  if (Number.isNaN(parsed.getTime())) return ''
  return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' })
}

export function formatCompanionAge(birthday: string | Date | null | undefined): string | null {
  if (!birthday) return null
  const born = new Date(birthday)
  if (Number.isNaN(born.getTime())) return null
  const now = new Date()
  let years = now.getUTCFullYear() - born.getUTCFullYear()
  const monthDelta = now.getUTCMonth() - born.getUTCMonth()
  if (monthDelta < 0 || (monthDelta === 0 && now.getUTCDate() < born.getUTCDate())) years -= 1
  if (years < 0) return null
  return years === 1 ? '1 year old' : `${years} years old`
}

export function formatManifestDateRange(startDate: string, endDate: string | null, current: boolean): string {
  const start = formatManifestMonth(startDate)
  const end = current ? 'Present' : endDate ? formatManifestMonth(endDate) : ''
  return `${start} — ${end}`
}

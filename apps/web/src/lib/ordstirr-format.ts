import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Backpack,
  Briefcase,
  Compass,
  Flag,
  GraduationCap,
  MapPin,
  PawPrint,
  ScrollText,
} from 'lucide-react'
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
  const active = data.companions.filter((companion) => !companion.passed)
  const passed = data.companions.filter((companion) => companion.passed)
  return [
    { id: 'bio', label: terms.bio, icon: ScrollText, count: null },
    { id: 'companions', label: terms.companions, icon: PawPrint, count: active.length || null },
    {
      id: 'in-memoriam',
      label: terms.summit_reached,
      icon: Award,
      count: passed.length || null,
    },
  ]
}

export function manifestPublicUrl(
  username: string | null | undefined,
  customDomain?: string | null,
): string | null {
  if (!username?.trim()) return null
  const user = username.trim()
  const path = `/ordstirr/${user}`
  const domain = customDomain?.trim()
  if (domain) {
    const base = (domain.startsWith('http') ? domain : `https://${domain}`).replace(/\/$/, '')
    // Custom domain may already be a full public URL (legacy /manifest or /ordstirr).
    if (/\/(manifest|ordstirr)(\/|$)/i.test(base)) return base
    return `${base}${path}`
  }
  // Apex personal site serves public Ordstirr only.
  return `https://levismith.us${path}`
}

export function manifestPublicJourneyUrl(
  username: string | null | undefined,
  customDomain?: string | null,
): string | null {
  const manifest = manifestPublicUrl(username, customDomain)
  if (!manifest) return null
  if (/\/ferd\/?$/i.test(manifest)) return manifest
  if (/\/journey\/?$/i.test(manifest)) {
    return manifest.replace(/\/journey\/?$/i, '/ferd')
  }
  return `${manifest.replace(/\/$/, '')}/ferd`
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

export function formatManifestDateRange(
  startDate: string,
  endDate: string | null,
  current: boolean,
): string {
  const start = formatManifestMonth(startDate)
  const end = current ? 'Present' : endDate ? formatManifestMonth(endDate) : ''
  return `${start} — ${end}`
}

/** Newest date first; missing/invalid dates sort last. */
export function compareIsoDateDesc(
  a: string | Date | null | undefined,
  b: string | Date | null | undefined,
): number {
  const at = a ? new Date(a).getTime() : Number.NaN
  const bt = b ? new Date(b).getTime() : Number.NaN
  const aOk = !Number.isNaN(at)
  const bOk = !Number.isNaN(bt)
  if (!aOk && !bOk) return 0
  if (!aOk) return 1
  if (!bOk) return -1
  return bt - at
}

/** Leidangr / expeditions: current roles first, then start date descending. */
export function sortExpeditionsByDateDesc<T extends { startDate: string; current?: boolean }>(
  items: T[],
): T[] {
  return [...items].sort((a, b) => {
    if (Boolean(a.current) !== Boolean(b.current)) return a.current ? -1 : 1
    return compareIsoDateDesc(a.startDate, b.startDate)
  })
}

/** Tindar / summits: date descending. */
export function sortSummitsByDateDesc<T extends { date: string | null }>(items: T[]): T[] {
  return [...items].sort((a, b) => compareIsoDateDesc(a.date, b.date))
}

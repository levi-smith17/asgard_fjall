import {
  Anvil,
  Bolt,
  CalendarDays,
  LayoutDashboard,
  NotebookPen,
  Rocket,
  ScrollText,
  TreePine,
  UserRound,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Terms } from '@/lib/terminology'

export const LATTIC_FORGE_URL = 'https://forge.lattic.app'

export type FjallNavItem = {
  key: string
  label: string
  href: string
  icon: LucideIcon
  external?: boolean
}

export type FjallNavGroupId = 'overview' | 'personal' | 'extras'

export type FjallNavGroup = {
  id: FjallNavGroupId
  label: string
  icon: LucideIcon
  /** Overview never collapses into a flyout. */
  neverCollapse?: boolean
  items: FjallNavItem[]
}

/** Sidebar groups aligned with RealmOps: Yfirlit → Sjálfr → Fleira. Sendibod is footer-only. */
export function getFjallNavGroups(terms: Terms): FjallNavGroup[] {
  return [
    {
      id: 'overview',
      label: terms.overviewGroup,
      icon: LayoutDashboard,
      neverCollapse: true,
      items: [
        {
          key: 'hlidskjalf',
          label: terms.dashboard,
          href: '/hlidskjalf',
          icon: LayoutDashboard,
        },
      ],
    },
    {
      id: 'personal',
      label: terms.fjallPersonalGroup,
      icon: UserRound,
      items: [
        { key: 'audr', label: terms.provisions, href: '/audr', icon: Wallet },
        { key: 'dagatal', label: terms.calendar, href: '/dagatal', icon: CalendarDays },
        { key: 'ordstirr', label: terms.resume, href: '/ordstirr', icon: ScrollText },
        { key: 'sogur', label: terms.notes, href: '/sogur', icon: NotebookPen },
      ],
    },
    {
      id: 'extras',
      label: terms.fjallExtrasGroup,
      icon: Bolt,
      items: [
        { key: 'nidjatal', label: terms.nidjatal, href: '/nidjatal', icon: TreePine },
        { key: 'stjornur', label: terms.starfield, href: '/stjornur', icon: Rocket },
        {
          key: 'volundr',
          label: terms.forge,
          href: LATTIC_FORGE_URL,
          icon: Anvil,
          external: true,
        },
      ],
    },
  ]
}

/** Flat nav items (excludes Sendibod). */
export function getFjallNavItems(terms: Terms): FjallNavItem[] {
  return getFjallNavGroups(terms).flatMap((group) => group.items)
}

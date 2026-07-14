import {
  Anvil,
  CalendarDays,
  LayoutDashboard,
  MessageSquare,
  NotebookPen,
  Rocket,
  ScrollText,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Terms } from '@/lib/terminology'
import { termsFor } from '@/lib/terminology'

export const LATTIC_FORGE_URL = 'https://forge.lattic.app'

export type FjallNavItem = {
  key: string
  label: string
  href: string
  icon: LucideIcon
  external?: boolean
}

const ASGARD_SORT_LABEL: Record<string, keyof Terms> = {
  audr: 'provisions',
  dagatal: 'calendar',
  ordstirr: 'resume',
  sendibod: 'messages',
  sogur: 'notes',
  stjornur: 'starfield',
}

/** Hlidskjalf first, then alphabetize apps by Asgard labels; Völundr after Stjornur. */
export function getFjallNavItems(terms: Terms): FjallNavItem[] {
  const asgard = termsFor('ASGARD')
  const pinned: FjallNavItem = {
    key: 'hlidskjalf',
    label: terms.dashboard,
    href: '/hlidskjalf',
    icon: LayoutDashboard,
  }
  const rest: FjallNavItem[] = [
    { key: 'audr', label: terms.provisions, href: '/audr', icon: Wallet },
    { key: 'dagatal', label: terms.calendar, href: '/dagatal', icon: CalendarDays },
    { key: 'ordstirr', label: terms.resume, href: '/ordstirr', icon: ScrollText },
    { key: 'sendibod', label: terms.messages, href: '/sendibod', icon: MessageSquare },
    { key: 'sogur', label: terms.notes, href: '/sogur', icon: NotebookPen },
    { key: 'stjornur', label: terms.starfield, href: '/stjornur', icon: Rocket },
  ]
  rest.sort((a, b) => {
    const labelA = String(asgard[ASGARD_SORT_LABEL[a.key]] ?? a.label)
    const labelB = String(asgard[ASGARD_SORT_LABEL[b.key]] ?? b.label)
    return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' })
  })

  const forge: FjallNavItem = {
    key: 'volundr',
    label: terms.forge,
    href: LATTIC_FORGE_URL,
    icon: Anvil,
    external: true,
  }

  const withForge: FjallNavItem[] = []
  for (const item of rest) {
    withForge.push(item)
    if (item.key === 'stjornur') withForge.push(forge)
  }
  if (!rest.some((item) => item.key === 'stjornur')) withForge.push(forge)

  return [pinned, ...withForge]
}

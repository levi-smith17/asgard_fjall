import {
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

export type FjallNavItem = {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

const ASGARD_SORT_LABEL: Record<string, keyof Terms> = {
  audr: 'provisions',
  dagatal: 'calendar',
  ordstirr: 'resume',
  sendibod: 'messages',
  sogur: 'notes',
  stjornur: 'starfield',
}

/** Pin Hlidskjalf, then alphabetize remaining apps by Asgard (Norse) labels. */
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
  return [pinned, ...rest]
}

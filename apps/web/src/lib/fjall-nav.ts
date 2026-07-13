import {
  CalendarDays,
  Home,
  MessageSquare,
  NotebookPen,
  Rocket,
  ScrollText,
  Wallet,
  type LucideIcon,
} from 'lucide-react'
import type { Terms } from '@/lib/terminology'

export type FjallNavItem = {
  key: string
  label: string
  href: string
  icon: LucideIcon
}

export function getFjallNavItems(terms: Terms): FjallNavItem[] {
  return [
    { key: 'hlidskjalf', label: terms.dashboard, href: '/hlidskjalf', icon: Home },
    { key: 'audr', label: terms.provisions, href: '/audr', icon: Wallet },
    { key: 'dagatal', label: terms.calendar, href: '/dagatal', icon: CalendarDays },
    { key: 'ordstirr', label: terms.resume, href: '/ordstirr', icon: ScrollText },
    { key: 'sogur', label: terms.notes, href: '/sogur', icon: NotebookPen },
    { key: 'stjornur', label: terms.starfield, href: '/stjornur', icon: Rocket },
    { key: 'sendibod', label: terms.messages, href: '/sendibod', icon: MessageSquare },
  ]
}

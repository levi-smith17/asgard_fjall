import { getFjallNavItems } from '@/lib/fjall-nav'
import type { Terms } from '@/lib/terminology'
import type { CommandSearchEntry } from '@/lib/command-search/types'

function thingSectionPath(section: string): string {
  return `/thing?section=${encodeURIComponent(section)}`
}

/** Static navigation + Thing settings aliases (Fjall surfaces only). */
export function buildFjallNavigationEntries(terms: Terms): CommandSearchEntry[] {
  const product = terms.productName
  const nav = getFjallNavItems(terms).map((item): CommandSearchEntry => ({
    id: `nav-${item.key}`,
    label: item.label,
    subtitle: item.external ? 'External — Lattic Forge' : undefined,
    productPill: product,
    areaPill: 'Navigation',
    path: item.href,
    externalUrl: item.external ? item.href : undefined,
    keywords: [
      item.key,
      item.label,
      ...(item.external ? ['forge', 'lattic', 'volundr', 'völundr'] : []),
    ],
  }))

  const settings: CommandSearchEntry[] = [
    {
      id: 'nav-settings',
      label: terms.settings,
      subtitle: 'Thing — account and preferences',
      productPill: product,
      areaPill: 'Settings',
      path: '/thing',
      keywords: ['settings', 'thing', 'config', 'configuration'],
    },
    {
      id: 'nav-settings-account',
      label: terms.settings,
      subtitle: `${terms.account} — profile settings`,
      productPill: product,
      areaPill: 'Settings',
      path: thingSectionPath('account'),
      keywords: ['settings', 'thing', 'account', 'profile', 'heiti'],
    },
    {
      id: 'nav-settings-privacy',
      label: terms.settings,
      subtitle: `${terms.privacy} — profile visibility`,
      productPill: product,
      areaPill: 'Settings',
      path: thingSectionPath('privacy'),
      keywords: ['settings', 'thing', 'privacy', 'frid', 'visibility'],
    },
    {
      id: 'nav-settings-dagatal',
      label: terms.settings,
      subtitle: `${terms.calendar} — calendars and itinerary preferences`,
      productPill: product,
      areaPill: 'Settings',
      path: thingSectionPath('dagatal'),
      keywords: ['settings', 'thing', 'dagatal', 'calendar', 'icloud', 'itinerary'],
    },
  ]

  return [...nav, ...settings]
}

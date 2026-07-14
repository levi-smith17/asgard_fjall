import { BookOpen, Compass, Mail, type LucideIcon } from 'lucide-react'
import { publicManifestPath, type PublicManifestView } from '@/lib/public-manifest-path'
import type { Terms } from '@/lib/terminology'

export type PublicViewNavItem = {
  key: string
  view: PublicManifestView
  label: string
  href: string
  icon: LucideIcon
}

export function buildPublicViewLinks(username: string, terms: Terms): PublicViewNavItem[] {
  return [
    {
      key: 'public-manifest',
      view: 'manifest',
      label: terms.manifest,
      href: publicManifestPath(username, 'manifest'),
      icon: BookOpen,
    },
    {
      key: 'public-journey',
      view: 'journey',
      label: terms.bio_button,
      href: publicManifestPath(username, 'journey'),
      icon: Compass,
    },
    {
      key: 'public-contact',
      view: 'contact',
      label: terms.contact,
      href: publicManifestPath(username, 'contact'),
      icon: Mail,
    },
  ]
}

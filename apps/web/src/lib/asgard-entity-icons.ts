import {
  Bookmark,
  Folder,
  LayoutGrid,
  Shapes,
  Tag,
  type LucideIcon,
} from 'lucide-react'

/** Shared entity icons (add menus, New inspector titles, filters, catalog). */
export const ASGARD_ENTITY_ICONS = {
  laufar: Bookmark,
  greinar: Folder,
  runir: Tag,
  gerdir: Shapes,
  spjald: LayoutGrid,
} as const satisfies Record<string, LucideIcon>

export type AsgardEntityIconKey = keyof typeof ASGARD_ENTITY_ICONS

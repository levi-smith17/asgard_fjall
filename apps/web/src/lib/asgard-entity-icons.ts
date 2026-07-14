import {
  Folder,
  LayoutGrid,
  Shapes,
  Tag,
  type LucideIcon,
} from 'lucide-react'

/** Shared entity icons for Greinar / Runir / Gerdir / Spjald (sidebar, add menus, filters). */
export const ASGARD_ENTITY_ICONS = {
  greinar: Folder,
  runir: Tag,
  gerdir: Shapes,
  spjald: LayoutGrid,
} as const satisfies Record<string, LucideIcon>

export type AsgardEntityIconKey = keyof typeof ASGARD_ENTITY_ICONS

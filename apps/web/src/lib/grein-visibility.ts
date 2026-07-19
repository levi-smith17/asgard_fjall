import { isAudrRootName } from '@/lib/audr-run-root'
import type { Terms } from '@/lib/terminology'

/** Pages that support Greinar and expose a visibility toggle. */
export const GREIN_PAGE_IDS = ['hlidskjalf', 'sogur', 'audr'] as const

export type GreinPageId = (typeof GREIN_PAGE_IDS)[number]

/** Minimal Grein shape needed to resolve visibility. */
type VisibilityGrein = { name: string; hiddenPages?: string[] | null }

/** Toggle rows for the inspector, labelled with the same terms as the nav. */
export function greinPageOptions(terms: Terms): { id: GreinPageId; label: string }[] {
  return [
    { id: 'hlidskjalf', label: terms.dashboard },
    { id: 'sogur', label: terms.notes },
    { id: 'audr', label: terms.audr },
  ]
}

function isKnownPage(value: string): value is GreinPageId {
  return (GREIN_PAGE_IDS as readonly string[]).includes(value)
}

/**
 * Pages a Grein is hidden from. When `hiddenPages` is unset we fall back to the
 * legacy behavior: the Audr finance Grein is managed on Audr only.
 */
export function resolveGreinHiddenPages(grein: VisibilityGrein): GreinPageId[] {
  if (Array.isArray(grein.hiddenPages)) {
    return grein.hiddenPages.filter(isKnownPage)
  }
  return isAudrRootName(grein.name) ? ['hlidskjalf', 'sogur'] : []
}

export function isGreinVisibleOnPage(grein: VisibilityGrein, page: GreinPageId): boolean {
  return !resolveGreinHiddenPages(grein).includes(page)
}

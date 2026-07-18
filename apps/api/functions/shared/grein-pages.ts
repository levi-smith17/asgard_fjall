/** Pages that support Greinar visibility toggles. Keep in sync with the web `grein-visibility` module. */
export const GREIN_PAGE_IDS = ['hlidskjalf', 'sogur', 'audr'] as const

export type GreinPageId = (typeof GREIN_PAGE_IDS)[number]

/**
 * Normalize a client-supplied hiddenPages value into a deduped list of known page ids.
 * Returns undefined when the caller did not provide the field so callers can leave it untouched.
 */
export function sanitizeHiddenPages(value: unknown): GreinPageId[] | undefined {
  if (value === undefined) return undefined
  if (!Array.isArray(value)) return []
  const seen = new Set<GreinPageId>()
  for (const entry of value) {
    if (typeof entry === 'string' && (GREIN_PAGE_IDS as readonly string[]).includes(entry)) {
      seen.add(entry as GreinPageId)
    }
  }
  return [...seen]
}

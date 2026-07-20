/** Account email shown in the profile menu (single-user). */
export const OWNER_ACCOUNT_EMAIL = 'me@levismith.us'

const LEGACY_OWNER_EMAILS = new Set([
  'levi@cairn.ing',
  'levi_smith17@icloud.com',
])

/** Prefer the canonical owner email over retired Cairn / iCloud addresses. */
export function resolveOwnerAccountEmail(stored: string | null | undefined): string {
  const trimmed = stored?.trim() || ''
  if (!trimmed || LEGACY_OWNER_EMAILS.has(trimmed.toLowerCase())) {
    return OWNER_ACCOUNT_EMAIL
  }
  return trimmed
}

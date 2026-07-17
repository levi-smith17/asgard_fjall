/** Public companion / landmark media hosted on the Asgard media CDN. */
const CLOUDFRONT_PUBLIC_MEDIA_URL =
  import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL?.replace(/\/$/, '') ||
  'https://media.asgard.levismith.us'

export function publicCompanionMediaUrl(key: string): string {
  if (/^https?:\/\//i.test(key)) return key
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key.replace(/^\//, '')}`
}

/** @deprecated Prefer publicCompanionMediaUrl */
export const publicMediaUrl = publicCompanionMediaUrl

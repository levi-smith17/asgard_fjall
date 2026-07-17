/** Public Ordstirr companion media CDN. */
const CLOUDFRONT_PUBLIC_MEDIA_URL =
  import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL?.replace(/\/$/, '') ||
  'https://media.asgard.levismith.us'

export function publicMediaUrl(key: string): string {
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key.replace(/^\//, '')}`
}

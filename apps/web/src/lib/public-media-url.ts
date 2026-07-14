/** Public companion / landmark media hosted on Cairn CloudFront. */
const CLOUDFRONT_PUBLIC_MEDIA_URL =
  import.meta.env.VITE_CLOUDFRONT_PUBLIC_MEDIA_URL?.replace(/\/$/, '') || 'https://media.cairn.ing'

export function publicCompanionMediaUrl(key: string): string {
  if (/^https?:\/\//i.test(key)) return key
  return `${CLOUDFRONT_PUBLIC_MEDIA_URL}/${key.replace(/^\//, '')}`
}

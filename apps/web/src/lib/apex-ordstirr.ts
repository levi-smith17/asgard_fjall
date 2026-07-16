/** Apex hosts that serve public Ordstirr only (no app shell). */
export const APEX_ORDSTIRR_HOSTS = new Set(
  (import.meta.env.VITE_APEX_ORDSTIRR_HOSTS?.trim() || 'levismith.us,www.levismith.us')
    .split(',')
    .map((host) => host.trim().toLowerCase())
    .filter(Boolean),
)

/** Single-user public profile username for apex Ordstirr. */
export const APEX_ORDSTIRR_USERNAME =
  import.meta.env.VITE_APEX_ORDSTIRR_USERNAME?.trim() || 'levi'

export function isApexOrdstirrHost(hostname = window.location.hostname): boolean {
  return APEX_ORDSTIRR_HOSTS.has(hostname.toLowerCase())
}

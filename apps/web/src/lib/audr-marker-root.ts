/** Preferred Audr marker root after Cairn→Asgard migration. */
export const AUDR_MARKER_ROOT = 'Audr'

/** Legacy Summit root still present in Dynamo until data cutover. */
export const LEGACY_AUDR_MARKER_ROOT = 'Provisions'

export function isUnderAudrMarkerRoot(markerName: string): boolean {
  return (
    markerName === AUDR_MARKER_ROOT ||
    markerName.startsWith(`${AUDR_MARKER_ROOT}/`) ||
    markerName === LEGACY_AUDR_MARKER_ROOT ||
    markerName.startsWith(`${LEGACY_AUDR_MARKER_ROOT}/`)
  )
}

/**
 * Resolve which root path exists in the live Run catalog.
 * Prefer Audr; fall back to Provisions until Dynamo is migrated.
 */
export function resolveAudrMarkerRootPath(
  markers: Iterable<{ name: string }>,
): string[] {
  let hasAudr = false
  let hasLegacy = false
  for (const marker of markers) {
    if (marker.name === AUDR_MARKER_ROOT || marker.name.startsWith(`${AUDR_MARKER_ROOT}/`)) {
      hasAudr = true
      break
    }
    if (
      marker.name === LEGACY_AUDR_MARKER_ROOT ||
      marker.name.startsWith(`${LEGACY_AUDR_MARKER_ROOT}/`)
    ) {
      hasLegacy = true
    }
  }
  if (hasAudr) return [AUDR_MARKER_ROOT]
  if (hasLegacy) return [LEGACY_AUDR_MARKER_ROOT]
  return [AUDR_MARKER_ROOT]
}

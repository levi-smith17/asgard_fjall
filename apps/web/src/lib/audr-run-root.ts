/** Preferred Audr run root after Fjall→Asgard migration. */
export const AUDR_RUN_ROOT = 'Audr'

/** Legacy Summit root still present in Dynamo until data cutover. */
export const LEGACY_AUDR_RUN_ROOT = 'Provisions'

export function isAudrRootName(name: string): boolean {
  return name === AUDR_RUN_ROOT || name === LEGACY_AUDR_RUN_ROOT
}

export function isUnderAudrRunRoot(runName: string): boolean {
  return (
    runName === AUDR_RUN_ROOT ||
    runName.startsWith(`${AUDR_RUN_ROOT}/`) ||
    runName === LEGACY_AUDR_RUN_ROOT ||
    runName.startsWith(`${LEGACY_AUDR_RUN_ROOT}/`)
  )
}

/**
 * Resolve which root path exists in the live Run catalog.
 * Prefer Audr; fall back to Provisions until Dynamo is migrated.
 */
export function resolveAudrRunRootPath(
  runir: Iterable<{ name: string }>,
): string[] {
  let hasAudr = false
  let hasLegacy = false
  for (const run of runir) {
    if (run.name === AUDR_RUN_ROOT || run.name.startsWith(`${AUDR_RUN_ROOT}/`)) {
      hasAudr = true
      break
    }
    if (
      run.name === LEGACY_AUDR_RUN_ROOT ||
      run.name.startsWith(`${LEGACY_AUDR_RUN_ROOT}/`)
    ) {
      hasLegacy = true
    }
  }
  if (hasAudr) return [AUDR_RUN_ROOT]
  if (hasLegacy) return [LEGACY_AUDR_RUN_ROOT]
  return [AUDR_RUN_ROOT]
}

/** Grein (grein) id for the Audr finance folder, if present under either name. */
export function findAudrGreinId(
  greinar: Iterable<{ id: string; name: string }>,
): string | null {
  let legacyId: string | null = null
  for (const grein of greinar) {
    if (grein.name === AUDR_RUN_ROOT) return grein.id
    if (grein.name === LEGACY_AUDR_RUN_ROOT) legacyId = grein.id
  }
  return legacyId
}

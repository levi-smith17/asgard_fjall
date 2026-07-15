const STORAGE_KEY = 'asgard.audr.defaultSjodrId'

export function getDefaultSjodrId(): string | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value?.trim() || null
  } catch {
    return null
  }
}

export function setDefaultSjodrId(fundId: string | null): void {
  try {
    if (!fundId) localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, fundId)
  } catch {
    // ignore quota / private mode
  }
}

export function isDefaultSjodrId(fundId: string | null | undefined): boolean {
  if (!fundId) return false
  return getDefaultSjodrId() === fundId
}

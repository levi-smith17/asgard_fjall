const STORAGE_KEY = 'fjall:inspector-pinned'

export function readInspectorPinned(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === '1'
  } catch {
    return false
  }
}

export function writeInspectorPinned(pinned: boolean): void {
  try {
    localStorage.setItem(STORAGE_KEY, pinned ? '1' : '0')
  } catch {
    /* ignore */
  }
}

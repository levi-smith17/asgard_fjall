import { useSyncExternalStore } from 'react'
import {
  loadTerminologyStyle,
  nextTerminologyStyle,
  saveTerminologyStyle,
  terminologyToggleTooltip,
  termsFor,
  type TerminologyStyle,
  type Terms,
} from '@/lib/terminology'

let style = typeof window !== 'undefined' ? loadTerminologyStyle() : ('ASGARD' as TerminologyStyle)
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

function getSnapshot() {
  return style
}

function setStyle(next: TerminologyStyle) {
  style = next
  saveTerminologyStyle(next)
  listeners.forEach((l) => l())
}

export function useTerminology() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => 'ASGARD' as TerminologyStyle)
  return {
    style: current,
    terminology: current,
    terms: termsFor(current),
    setStyle,
    cycleTerminology: () => setStyle(nextTerminologyStyle(current)),
    toggleTooltip: terminologyToggleTooltip(current),
  }
}

/** Alias matching Asgard's hook — returns the Terms object directly. */
export function useTerms(): Terms {
  return useTerminology().terms
}

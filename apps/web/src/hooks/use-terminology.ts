import { useSyncExternalStore } from 'react'
import {
  loadTerminologyStyle,
  saveTerminologyStyle,
  termsFor,
  type TerminologyStyle,
} from '@/lib/terminology'

let style = typeof window !== 'undefined' ? loadTerminologyStyle() : ('ASGARD' as TerminologyStyle)
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function getSnapshot() {
  return style
}

export function useTerminology() {
  const current = useSyncExternalStore(subscribe, getSnapshot, () => 'ASGARD' as TerminologyStyle)
  return {
    style: current,
    terms: termsFor(current),
    setStyle: (next: TerminologyStyle) => {
      style = next
      saveTerminologyStyle(next)
      listeners.forEach((l) => l())
    },
  }
}

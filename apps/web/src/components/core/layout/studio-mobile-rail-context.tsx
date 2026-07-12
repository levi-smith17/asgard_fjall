import { createContext, useContext } from 'react'

type StudioMobileRailContextValue = {
  toggle: React.ReactNode
}

export const StudioMobileRailContext = createContext<StudioMobileRailContextValue | null>(null)

export function useStudioMobileRailToggle(): React.ReactNode {
  return useContext(StudioMobileRailContext)?.toggle ?? null
}

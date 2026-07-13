export type SfResource = {
  pk: 'SF#RESOURCE'
  sk: string
  name: string
  abbreviation: string
  type: string
  tier: 0 | 1 | 2 | 3 | null
  mined: boolean
  ingredients: string[]
}

export type SfNetwork = {
  pk: string
  sk: string
  name: string
  abbreviation: string
  rootOutpostId?: string
  createdAt: string
}

export type SfOutpostSupply = {
  fromOutpostId?: string | null
  fromPlanet?: string | null
  fromSystem?: string | null
  relay?: {
    planet: string
    system: string
  } | null
}

export type SfOutpostResource = {
  resourceId: string
  name: string
  abbreviation: string
  onsite: boolean
  origin?: boolean
  supplies?: SfOutpostSupply[]
  fromOutpostId?: string | null
  fromPlanet?: string | null
  fromSystem?: string | null
  relay?: {
    planet: string
    system: string
  } | null
}

export type SfOutpost = {
  pk: string
  sk: string
  networkId: string
  system: string
  planet: string
  parentId?: string
  depth: number
  position: { x: number; y: number }
  resources: SfOutpostResource[]
  transferStationLimit: number
}

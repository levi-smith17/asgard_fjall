export type StjornurResource = {
  pk: 'SF#RESOURCE'
  sk: string
  name: string
  abbreviation: string
  type: string
  tier: 0 | 1 | 2 | 3 | null
  mined: boolean
  ingredients: string[]
}

export type StjornurNetwork = {
  pk: string
  sk: string
  name: string
  abbreviation: string
  rootOutpostId?: string
  createdAt: string
}

export type StjornurOutpostSupply = {
  fromOutpostId?: string | null
  fromPlanet?: string | null
  fromSystem?: string | null
  relay?: {
    planet: string
    system: string
  } | null
}

export type StjornurOutpostResource = {
  resourceId: string
  name: string
  abbreviation: string
  onsite: boolean
  origin?: boolean
  supplies?: StjornurOutpostSupply[]
  fromOutpostId?: string | null
  fromPlanet?: string | null
  fromSystem?: string | null
  relay?: {
    planet: string
    system: string
  } | null
}

export type StjornurOutpost = {
  pk: string
  sk: string
  networkId: string
  system: string
  planet: string
  parentId?: string
  depth: number
  position: { x: number; y: number }
  resources: StjornurOutpostResource[]
  transferStationLimit: number
}

/** Nidjatal (genealogy) types — Kin and Bloodline records. */

export type NidjatalBloodlineEndReason = 'DIVORCE' | 'DEATH' | 'SEPARATION'

export type NidjatalBloodline = {
  id: string
  kinId: string
  kinName: string
  startDate?: string
  endDate?: string
  endReason?: NidjatalBloodlineEndReason
  current: boolean
}

export type NidjatalKin = {
  pk: string
  sk: string
  givenName: string
  middleName?: string
  nickname?: string
  surname: string
  isSelf?: boolean
  birthDate?: string
  deathDate?: string
  fatherId?: string
  fatherUnknown: boolean
  motherId?: string
  motherUnknown: boolean
  bloodlines: NidjatalBloodline[]
  createdAt: string
  updatedAt: string
}

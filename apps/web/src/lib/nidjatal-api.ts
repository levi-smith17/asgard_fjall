import { fjallFetch } from '@/lib/data-client'
import type { NidjatalBloodline, NidjatalKin } from '@/lib/nidjatal-types'

export interface NidjatalKinPayload {
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
}

export async function fetchNidjatalKin(): Promise<NidjatalKin[]> {
  const data = await fjallFetch<NidjatalKin[]>('/nidjatal/kin')
  return data ?? []
}

export async function createNidjatalKin(payload: NidjatalKinPayload): Promise<NidjatalKin> {
  return fjallFetch<NidjatalKin>('/nidjatal/kin', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function updateNidjatalKin(
  id: string,
  payload: Partial<NidjatalKinPayload>,
): Promise<void> {
  await fjallFetch(`/nidjatal/kin/${id}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function deleteNidjatalKin(id: string): Promise<void> {
  await fjallFetch(`/nidjatal/kin/${id}`, { method: 'DELETE' })
}

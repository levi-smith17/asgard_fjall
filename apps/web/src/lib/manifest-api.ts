import { cairnFetch } from '@/lib/data-client'

export type ManifestOrigins = {
  headline: string | null
  summary: string | null
  bio: string | null
  location: string | null
  website: string | null
  linkedin: string | null
  github: string | null
}

export type ManifestExpedition = {
  id: string
  title: string
  company: string
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestTraining = {
  id: string
  institution: string
  degree: string | null
  field: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestGear = {
  id: string
  name: string
  category: string | null
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT' | null
}

export type ManifestLandmark = {
  id: string
  name: string
  description: string | null
  url: string | null
  githubUrl: string | null
  startDate: string | null
  endDate: string | null
  current: boolean
}

export type ManifestSummit = {
  id: string
  title: string
  issuer: string | null
  date: string | null
  description: string | null
  url: string | null
}

export type ManifestPathfinding = {
  id: string
  organization: string
  role: string | null
  location: string | null
  startDate: string
  endDate: string | null
  current: boolean
  description: string | null
}

export type ManifestCompanionMedia = {
  id: string
  key: string
  type: 'IMAGE' | 'VIDEO'
  caption?: string | null
  order: number
}

export type ManifestCompanion = {
  id: string
  name: string
  species: string
  breed?: string | null
  birthday?: string | null
  bio?: string | null
  passed?: boolean
  media: ManifestCompanionMedia[]
}

export type ManifestData = {
  user: {
    name: string | null
    email: string | null
    image: string | null
  }
  username: string | null
  isAdmin: boolean
  origins: ManifestOrigins | null
  expeditions: ManifestExpedition[]
  training: ManifestTraining[]
  gear: ManifestGear[]
  landmarks: ManifestLandmark[]
  summits: ManifestSummit[]
  pathfinding: ManifestPathfinding[]
  companions: ManifestCompanion[]
}

export async function fetchManifest(): Promise<ManifestData> {
  return cairnFetch<ManifestData>('/manifest')
}

export async function saveManifestOrigins(data: ManifestOrigins): Promise<void> {
  await cairnFetch<void>('/manifest/origins', { method: 'PUT', body: JSON.stringify(data) })
}

export async function saveManifestSummit(data: {
  id?: string; title: string; issuer: string | null; date: string | null; description: string | null; url: string | null
}): Promise<void> {
  const { id, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/summits/${id}` : '/manifest/summits', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, date: payload.date ? new Date(payload.date).toISOString() : null }),
  })
}

export async function deleteManifestSummit(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/summits/${id}`, { method: 'DELETE' })
}

function toIsoDate(value: string | null): string | null {
  return value ? new Date(value).toISOString() : null
}

export async function saveManifestExpedition(data: {
  id?: string; title: string; company: string; location: string | null; startDate: string; endDate: string | null; current: boolean; description: string | null
}): Promise<void> {
  const { id, startDate, endDate, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/expeditions/${id}` : '/manifest/expeditions', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, startDate: new Date(startDate).toISOString(), endDate: toIsoDate(endDate) }),
  })
}

export async function deleteManifestExpedition(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/expeditions/${id}`, { method: 'DELETE' })
}

export async function saveManifestTraining(data: {
  id?: string; institution: string; degree: string | null; field: string | null; startDate: string; endDate: string | null; current: boolean; description: string | null
}): Promise<void> {
  const { id, startDate, endDate, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/training/${id}` : '/manifest/training', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, startDate: new Date(startDate).toISOString(), endDate: toIsoDate(endDate) }),
  })
}

export async function deleteManifestTraining(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/training/${id}`, { method: 'DELETE' })
}

export async function saveManifestGear(data: {
  id?: string; name: string; category: string | null; level: ManifestGear['level']
}): Promise<void> {
  const { id, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/gear/${id}` : '/manifest/gear', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify(payload),
  })
}

export async function deleteManifestGear(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/gear/${id}`, { method: 'DELETE' })
}

export async function saveManifestLandmark(data: {
  id?: string; name: string; description: string | null; url: string | null; githubUrl: string | null; startDate: string | null; endDate: string | null; current: boolean
}): Promise<void> {
  const { id, startDate, endDate, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/landmarks/${id}` : '/manifest/landmarks', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, startDate: toIsoDate(startDate), endDate: toIsoDate(endDate) }),
  })
}

export async function deleteManifestLandmark(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/landmarks/${id}`, { method: 'DELETE' })
}

export async function saveManifestPathfinding(data: {
  id?: string; organization: string; role: string | null; location: string | null; startDate: string; endDate: string | null; current: boolean; description: string | null
}): Promise<void> {
  const { id, startDate, endDate, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/pathfinding/${id}` : '/manifest/pathfinding', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, startDate: new Date(startDate).toISOString(), endDate: toIsoDate(endDate) }),
  })
}

export async function deleteManifestPathfinding(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/pathfinding/${id}`, { method: 'DELETE' })
}

export async function saveManifestCompanion(data: {
  id?: string; name: string; species: string; breed: string | null; birthday: string | null; bio: string | null; passed: boolean
}): Promise<void> {
  const { id, birthday, ...payload } = data
  await cairnFetch<void>(id ? `/manifest/companions/${id}` : '/manifest/companions', {
    method: id ? 'PUT' : 'POST',
    body: JSON.stringify({ ...payload, birthday: toIsoDate(birthday) }),
  })
}

export async function deleteManifestCompanion(id: string): Promise<void> {
  await cairnFetch<void>(`/manifest/companions/${id}`, { method: 'DELETE' })
}

export async function uploadManifestCompanionMedia(
  file: File,
  companionId: string,
  order: number,
): Promise<{ key: string; mediaId: string; type: 'IMAGE' | 'VIDEO' }> {
  const data = await cairnFetch<{
    url: string
    key: string
    mediaId: string
    type: string
  }>('/companions/upload-url', {
    method: 'POST',
    body: JSON.stringify({
      companionId,
      contentType: file.type,
      fileSize: file.size,
      order,
    }),
  })
  await fetch(data.url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  })
  return {
    key: data.key,
    mediaId: data.mediaId,
    type: String(data.type).toUpperCase() === 'VIDEO' ? 'VIDEO' : 'IMAGE',
  }
}

export async function deleteManifestCompanionMedia(params: {
  companionId: string
  mediaId: string
}): Promise<void> {
  const query = new URLSearchParams({
    companionId: params.companionId,
    mediaId: params.mediaId,
  })
  await cairnFetch<void>(`/manifest/companions/media?${query}`, { method: 'DELETE' })
}

export async function saveManifestCompanionMedia(
  companionId: string,
  media: ManifestCompanionMedia[],
): Promise<void> {
  await cairnFetch<void>(`/manifest/companions/${companionId}`, {
    method: 'PUT',
    body: JSON.stringify({
      media: media.map((item, index) => ({
        ...item,
        order: index,
      })),
    }),
  })
}

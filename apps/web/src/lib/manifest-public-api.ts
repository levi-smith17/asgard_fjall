import { fjallFetch } from '@/lib/data-client'
import { normalizeTerminologyStyle, type TerminologyStyle } from '@/lib/terminology'

export type PublicManifestData = {
  wayfarer: {
    username: string
    name: string | null
    email: string | null
    image?: string | null
    avatar?: string | null
    defaultTerminology: TerminologyStyle
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
    defaultPalette?: 'green' | 'fjall' | null
  }
  origins: {
    headline: string | null
    summary: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
  } | null
  expeditions: Array<{
    id: string
    title: string
    company: string
    location: string | null
    startDate: string
    endDate: string | null
    current: boolean
    description: string | null
  }>
  training: Array<{
    id: string
    institution: string
    degree: string | null
    field: string | null
    startDate: string
    endDate: string | null
    current: boolean
    description: string | null
  }>
  gear: Array<{ id: string; name: string; category: string | null; level: string | null }>
  landmarks: Array<{
    id: string
    name: string
    description: string | null
    url: string | null
    githubUrl: string | null
    startDate: string | null
    endDate: string | null
    current: boolean
  }>
  summits: Array<{
    id: string
    title: string
    issuer: string | null
    date: string | null
    description: string | null
    url: string | null
  }>
  pathfinding: Array<{
    id: string
    organization: string
    role: string | null
    location: string | null
    startDate: string
    endDate: string | null
    current: boolean
    description: string | null
  }>
}

export type PublicJourneyData = {
  wayfarer: PublicManifestData['wayfarer']
  origins: {
    headline: string | null
    summary: string | null
    bio: string | null
    location: string | null
    website: string | null
    linkedin: string | null
    github: string | null
  } | null
  companions: Array<{
    id: string
    name: string
    species?: string | null
    breed?: string | null
    birthday?: string | null
    passed?: boolean | string | null
    bio?: string | null
    imageUrl?: string | null
    media?: Array<{ id: string; key: string; type: string; caption?: string | null }>
  }>
}

export type PublicContactData = {
  wayfarer: {
    name: string | null
    email: string | null
    image: string | null
    defaultTerminology: TerminologyStyle
    defaultTheme: 'LIGHT' | 'DARK' | 'SYSTEM'
    defaultPalette?: 'green' | 'fjall' | null
  }
}

function normalizePublicWayfarer<T extends { defaultTerminology?: string | null }>(
  wayfarer: T,
): T & { defaultTerminology: TerminologyStyle } {
  return {
    ...wayfarer,
    defaultTerminology: normalizeTerminologyStyle(wayfarer.defaultTerminology),
  }
}

export async function fetchPublicManifest(username: string): Promise<PublicManifestData> {
  const data = await fjallFetch<PublicManifestData>(`/public/manifest/${encodeURIComponent(username)}`)
  return { ...data, wayfarer: normalizePublicWayfarer(data.wayfarer) }
}

export async function fetchPublicJourney(username: string): Promise<PublicJourneyData> {
  const data = await fjallFetch<PublicJourneyData>(
    `/public/manifest/${encodeURIComponent(username)}/journey`,
  )
  return { ...data, wayfarer: normalizePublicWayfarer(data.wayfarer) }
}

export async function fetchPublicContact(username: string): Promise<PublicContactData> {
  const data = await fjallFetch<PublicContactData>(
    `/public/manifest/${encodeURIComponent(username)}/contact`,
  )
  return { ...data, wayfarer: normalizePublicWayfarer(data.wayfarer) }
}

export async function submitPublicContact(
  username: string,
  body: { senderName: string; senderEmail: string; body: string },
): Promise<{ threadUrl?: string }> {
  return fjallFetch<{ threadUrl?: string }>(
    `/public/manifest/${encodeURIComponent(username)}/contact`,
    {
      method: 'POST',
      body: JSON.stringify(body),
    },
  )
}

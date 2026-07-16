import { cairnFetch } from '@/lib/data-client'

export type ThreadReply = {
  id: string
  body: string
  direction: 'INBOUND' | 'OUTBOUND'
  senderName: string | null
  createdAt: string
}

export type ThreadData = {
  id: string
  senderName: string | null
  body: string
  createdAt: string
  tokenExpiresAt: string | null
  wayfarer: {
    name: string | null
    image: string | null
    username: string | null
  }
  replies: ThreadReply[]
}

export async function getThread(token: string): Promise<ThreadData> {
  return cairnFetch<ThreadData>(`/public/thread/${encodeURIComponent(token)}`)
}

export async function sendThreadReply(
  token: string,
  html: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    await cairnFetch<void>(`/public/thread/${encodeURIComponent(token)}/reply`, {
      method: 'POST',
      body: JSON.stringify({ body: html }),
    })
    return { ok: true }
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Failed to send reply',
    }
  }
}

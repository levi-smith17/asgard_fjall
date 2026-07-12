import { SESSION_COOKIE_NAME } from '@/lib/config'

/** Client-visible session flag only. Real HttpOnly cookie is set by auth surface later. */
const LOCAL_FLAG = `${SESSION_COOKIE_NAME}_present`

export function markSessionPresent(present: boolean) {
  if (present) localStorage.setItem(LOCAL_FLAG, '1')
  else localStorage.removeItem(LOCAL_FLAG)
}

export function hasLocalSessionFlag(): boolean {
  return localStorage.getItem(LOCAL_FLAG) === '1'
}

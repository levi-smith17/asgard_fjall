export const FJALL_API_URL =
  import.meta.env.VITE_FJALL_API_URL?.trim() || 'https://api.asgard.levismith.us'

export const WEBAUTHN_RP_ID =
  import.meta.env.VITE_WEBAUTHN_RP_ID?.trim() || 'levismith.us'

export const SESSION_COOKIE_NAME =
  import.meta.env.VITE_SESSION_COOKIE_NAME?.trim() || 'fjall_session'

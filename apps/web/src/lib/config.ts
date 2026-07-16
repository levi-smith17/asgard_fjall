export const CAIRN_API_URL =
  import.meta.env.VITE_CAIRN_API_URL?.trim() || 'https://api.cairn.ing'

/** Prod Cairn web client (public SPA ids — safe to bake in). */
export const COGNITO_USER_POOL_ID =
  import.meta.env.VITE_COGNITO_USER_POOL_ID?.trim() || 'us-east-2_lf42INJJ7'

export const COGNITO_CLIENT_ID =
  import.meta.env.VITE_COGNITO_CLIENT_ID?.trim() || '4sqhce1qj85imq4sk8i9dei36d'

export const WEBAUTHN_RP_ID =
  import.meta.env.VITE_WEBAUTHN_RP_ID?.trim() || 'levismith.us'

export const SESSION_COOKIE_NAME =
  import.meta.env.VITE_SESSION_COOKIE_NAME?.trim() || 'fjall_session'

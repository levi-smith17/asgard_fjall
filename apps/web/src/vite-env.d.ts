/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAIRN_API_URL?: string
  readonly VITE_COGNITO_USER_POOL_ID?: string
  readonly VITE_COGNITO_CLIENT_ID?: string
  readonly VITE_WEBAUTHN_RP_ID?: string
  readonly VITE_SESSION_COOKIE_NAME?: string
  readonly VITE_CLOUDFRONT_PUBLIC_MEDIA_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

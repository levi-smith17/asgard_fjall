/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAIRN_API_URL?: string
  readonly VITE_WEBAUTHN_RP_ID?: string
  readonly VITE_SESSION_COOKIE_NAME?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

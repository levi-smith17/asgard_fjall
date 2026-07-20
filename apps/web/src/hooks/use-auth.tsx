import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { setFjallAuthProvider } from '@/lib/data-client'
import {
  clearAccessToken,
  fetchAccessToken,
  fetchAuthStatus,
  fetchGateMe,
  getStoredAccessToken,
  logoutGate,
  storeAccessToken,
  type GateUser,
} from '@/lib/webauthn-client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthorized'

type DataUser = { id: string; email: string }

type AuthState = {
  loading: boolean
  /** Passkey / fjall_session gate. */
  status: AuthStatus
  gateUser: GateUser | null
  /** Data API identity (same as gate after passkey login). */
  dataUser: DataUser | null
  refresh: () => Promise<void>
  signOut: () => Promise<void>
  /** @deprecated use gateUser / dataUser */
  user: GateUser | DataUser | null
  configured: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [gateUser, setGateUser] = useState<GateUser | null>(null)
  const [dataUser, setDataUser] = useState<DataUser | null>(null)

  useEffect(() => {
    setFjallAuthProvider(async () => getStoredAccessToken())
  }, [])

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      const me = await fetchGateMe()
      if (!me) {
        clearAccessToken()
        setGateUser(null)
        setDataUser(null)
        setStatus('unauthorized')
        return
      }
      setGateUser(me)

      // Mint/reuse the data API Bearer before marking authenticated. New tabs have an
      // empty sessionStorage even when the HttpOnly gate cookie is valid, and data
      // queries must not race ahead without a token (they fail 401 with retry:false).
      let token = getStoredAccessToken()
      if (!token) {
        const issued = await fetchAccessToken()
        token = issued?.accessToken ?? null
        if (issued) {
          storeAccessToken(issued.accessToken)
          setDataUser({ id: issued.sub, email: issued.email })
          setStatus('authenticated')
          return
        }
      }
      if (token) {
        setDataUser({ id: me.sub, email: me.email })
      } else {
        // Gate cookie is valid but data Bearer could not be minted (often FJALL_SESSION_SECRET).
        setDataUser(null)
      }
      setStatus('authenticated')
    } catch {
      clearAccessToken()
      setGateUser(null)
      setDataUser(null)
      setStatus('unauthorized')
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    void fetchAuthStatus().catch(() => undefined)
  }, [])

  const value: AuthState = {
    loading: status === 'loading',
    status,
    gateUser,
    dataUser,
    refresh,
    signOut: async () => {
      try {
        await logoutGate()
      } catch {
        /* ignore */
      }
      clearAccessToken()
      setGateUser(null)
      setDataUser(null)
      setStatus('unauthorized')
    },
    user: gateUser ?? dataUser,
    configured: true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}

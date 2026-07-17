import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { setCairnAuthProvider } from '@/lib/data-client'
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
  cairnUser: DataUser | null
  /** @deprecated Cognito removed — always false. */
  cognitoConfigured: boolean
  refresh: () => Promise<void>
  /** @deprecated Cognito removed. */
  signInCognito: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** @deprecated use gateUser / cairnUser */
  user: GateUser | DataUser | null
  configured: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [gateUser, setGateUser] = useState<GateUser | null>(null)
  const [cairnUser, setCairnUser] = useState<DataUser | null>(null)

  useEffect(() => {
    setCairnAuthProvider(async () => getStoredAccessToken())
  }, [])

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      const me = await fetchGateMe()
      if (!me) {
        clearAccessToken()
        setGateUser(null)
        setCairnUser(null)
        setStatus('unauthorized')
        return
      }
      setGateUser(me)
      setStatus('authenticated')

      let token = getStoredAccessToken()
      if (!token) {
        const issued = await fetchAccessToken()
        token = issued?.accessToken ?? null
        if (issued) {
          storeAccessToken(issued.accessToken)
          setCairnUser({ id: issued.sub, email: issued.email })
          return
        }
      }
      if (token) {
        setCairnUser({ id: me.sub, email: me.email })
      } else {
        // Gate cookie is valid but data Bearer could not be minted (often FJALL_SESSION_SECRET).
        setCairnUser(null)
      }
    } catch {
      clearAccessToken()
      setGateUser(null)
      setCairnUser(null)
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
    cairnUser,
    cognitoConfigured: false,
    refresh,
    signInCognito: async () => {
      throw new Error('Cognito sign-in is disabled — use your passkey')
    },
    signOut: async () => {
      try {
        await logoutGate()
      } catch {
        /* ignore */
      }
      clearAccessToken()
      setGateUser(null)
      setCairnUser(null)
      setStatus('unauthorized')
    },
    user: gateUser ?? cairnUser,
    configured: true,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getCurrentSession,
  getIdToken,
  isCognitoConfigured,
  sessionToUser,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  type AuthUser,
} from '@/lib/cognito'
import { setCairnAuthProvider } from '@/lib/data-client'
import {
  fetchAuthStatus,
  fetchGateMe,
  logoutGate,
  type GateUser,
} from '@/lib/webauthn-client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthorized'

type AuthState = {
  loading: boolean
  /** Passkey / fjall_session gate. */
  status: AuthStatus
  gateUser: GateUser | null
  /** Cognito session for Cairn API Bearer (separate from passkey gate). */
  cairnUser: AuthUser | null
  cognitoConfigured: boolean
  refresh: () => Promise<void>
  signInCognito: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  /** @deprecated use gateUser / cairnUser */
  user: GateUser | AuthUser | null
  /** @deprecated passkey gate always required when auth API is up */
  configured: boolean
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const cognitoConfigured = isCognitoConfigured()
  const [status, setStatus] = useState<AuthStatus>('loading')
  const [gateUser, setGateUser] = useState<GateUser | null>(null)
  const [cairnUser, setCairnUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setCairnAuthProvider(getIdToken)
  }, [])

  const refresh = useCallback(async () => {
    setStatus('loading')
    try {
      const me = await fetchGateMe()
      if (!me) {
        setGateUser(null)
        setStatus('unauthorized')
      } else {
        setGateUser(me)
        setStatus('authenticated')
      }
    } catch {
      // Auth API unavailable — fall back to Cognito-only gate for local shell.
      if (cognitoConfigured) {
        const session = await getCurrentSession()
        if (session) {
          const user = sessionToUser(session)
          setGateUser({ sub: user.id, email: user.email })
          setCairnUser(user)
          setStatus('authenticated')
          return
        }
      }
      setGateUser(null)
      setStatus('unauthorized')
    }

    if (cognitoConfigured) {
      const session = await getCurrentSession()
      setCairnUser(session ? sessionToUser(session) : null)
    } else {
      setCairnUser(null)
    }
  }, [cognitoConfigured])

  useEffect(() => {
    void refresh()
  }, [refresh])

  // Warm auth status (detect whether passkeys exist) without blocking.
  useEffect(() => {
    void fetchAuthStatus().catch(() => undefined)
  }, [])

  const value: AuthState = {
    loading: status === 'loading',
    status,
    gateUser,
    cairnUser,
    cognitoConfigured,
    refresh,
    signInCognito: async (email, password) => {
      const next = await cognitoSignIn(email, password)
      setCairnUser(next)
      // When the passkey auth API is offline, Cognito also acts as the app gate.
      if (!gateUser) {
        setGateUser({ sub: next.id, email: next.email })
        setStatus('authenticated')
      }
    },
    signOut: async () => {
      try {
        await logoutGate()
      } catch {
        /* ignore */
      }
      cognitoSignOut()
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

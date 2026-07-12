import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import {
  getCurrentSession,
  getIdToken,
  isCognitoConfigured,
  sessionToUser,
  signIn as cognitoSignIn,
  signOut as cognitoSignOut,
  type AuthUser,
} from '@/lib/cognito'
import { setCairnAuthProvider } from '@/lib/cairn-client'

type AuthState = {
  loading: boolean
  configured: boolean
  user: AuthUser | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isCognitoConfigured()
  const [loading, setLoading] = useState(configured)
  const [user, setUser] = useState<AuthUser | null>(null)

  useEffect(() => {
    setCairnAuthProvider(getIdToken)
  }, [])

  useEffect(() => {
    if (!configured) {
      setLoading(false)
      return
    }
    let cancelled = false
    void getCurrentSession().then((session) => {
      if (cancelled) return
      setUser(session ? sessionToUser(session) : null)
      setLoading(false)
    })
    return () => {
      cancelled = true
    }
  }, [configured])

  const value: AuthState = {
    loading,
    configured,
    user,
    signIn: async (email, password) => {
      const next = await cognitoSignIn(email, password)
      setUser(next)
    },
    signOut: () => {
      cognitoSignOut()
      setUser(null)
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth requires AuthProvider')
  return ctx
}

import {
  AuthenticationDetails,
  CognitoUser,
  CognitoUserPool,
  CognitoUserSession,
} from 'amazon-cognito-identity-js'

export type AuthUser = {
  id: string
  email: string
}

import { COGNITO_USER_POOL_ID, COGNITO_CLIENT_ID } from '@/lib/config'

const userPoolId = COGNITO_USER_POOL_ID
const clientId = COGNITO_CLIENT_ID

export function isCognitoConfigured(): boolean {
  return Boolean(userPoolId && clientId)
}

export function getUserPool(): CognitoUserPool {
  if (!isCognitoConfigured()) {
    throw new Error('Cognito is not configured (VITE_COGNITO_USER_POOL_ID / VITE_COGNITO_CLIENT_ID)')
  }
  return new CognitoUserPool({ UserPoolId: userPoolId, ClientId: clientId })
}

export function sessionToUser(session: CognitoUserSession): AuthUser {
  const payload = session.getIdToken().decodePayload()
  return {
    id: String(payload.sub ?? ''),
    email: String(payload.email ?? ''),
  }
}

export function getCurrentSession(): Promise<CognitoUserSession | null> {
  if (!isCognitoConfigured()) return Promise.resolve(null)

  const pool = getUserPool()
  const user = pool.getCurrentUser()
  if (!user) return Promise.resolve(null)

  return new Promise((resolve) => {
    user.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session?.isValid()) {
        resolve(null)
        return
      }
      resolve(session)
    })
  })
}

export async function getIdToken(): Promise<string | null> {
  const session = await getCurrentSession()
  return session?.getIdToken().getJwtToken() ?? null
}

export function signIn(email: string, password: string): Promise<AuthUser> {
  const pool = getUserPool()
  const cognitoUser = new CognitoUser({ Username: email, Pool: pool })
  const authDetails = new AuthenticationDetails({ Username: email, Password: password })

  return new Promise((resolve, reject) => {
    cognitoUser.authenticateUser(authDetails, {
      onSuccess(session) {
        resolve(sessionToUser(session))
      },
      onFailure(err) {
        reject(err)
      },
    })
  })
}

export function signOut(): void {
  if (!isCognitoConfigured()) return
  getUserPool().getCurrentUser()?.signOut()
}

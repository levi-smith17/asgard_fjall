import { GetCommand } from '@aws-sdk/lib-dynamodb'
import type { APIGatewayProxyEventV2 } from 'aws-lambda'
import { dynamo, TABLE_NAME } from './db'
import { isApiToken, tokenLookupPk } from './api-token'
import { isFjallSessionToken, parseFjallSessionToken } from './fjall-session'

const fjallSessionSecret = process.env.FJALL_SESSION_SECRET?.trim()

function parseBearerToken(header: string | undefined): string | null {
  if (!header) return null
  const trimmed = header.trim()
  const bearerMatch = /^Bearer\s+(.+)$/i.exec(trimmed)
  if (bearerMatch?.[1]) return bearerMatch[1]
  if (/^csk_/.test(trimmed) || /^v1\./.test(trimmed)) {
    return trimmed
  }
  return null
}

function getAuthorizerSub(event: APIGatewayProxyEventV2): string | null {
  const authorizer = (event.requestContext as {
    authorizer?: {
      lambda?: { sub?: string }
      jwt?: { claims?: { sub?: string } }
      sub?: string
    }
  }).authorizer

  const lambdaSub = authorizer?.lambda?.sub
  if (typeof lambdaSub === 'string' && lambdaSub.length > 0) return lambdaSub

  const flatSub = authorizer?.sub
  if (typeof flatSub === 'string' && flatSub.length > 0) return flatSub

  const jwtSub = authorizer?.jwt?.claims?.sub
  if (typeof jwtSub === 'string' && jwtSub.length > 0) return jwtSub

  return null
}

async function verifyBearerSub(token: string): Promise<string | null> {
  if (isApiToken(token)) {
    try {
      const lookup = await dynamo.send(
        new GetCommand({
          TableName: TABLE_NAME,
          Key: {
            pk: tokenLookupPk(token),
            sk: 'META',
          },
        }),
      )
      const userId = lookup.Item?.userId
      return typeof userId === 'string' && userId ? userId : null
    } catch {
      return null
    }
  }

  if (isFjallSessionToken(token)) {
    if (!fjallSessionSecret) return null
    try {
      const user = parseFjallSessionToken(fjallSessionSecret, token)
      return user.sub
    } catch {
      return null
    }
  }

  return null
}

/** Best-effort caller id for public routes (authorization_type NONE). */
export async function getOptionalUserId(event: APIGatewayProxyEventV2): Promise<string | null> {
  const fromAuthorizer = getAuthorizerSub(event)
  if (fromAuthorizer) return fromAuthorizer

  const token = parseBearerToken(event.headers?.authorization ?? event.headers?.Authorization)
  if (!token) return null

  return verifyBearerSub(token)
}

export async function isUserAdmin(userId: string): Promise<boolean> {
  const result = await dynamo.send(
    new GetCommand({
      TableName: TABLE_NAME,
      Key: { pk: `USER#${userId}`, sk: 'PROFILE' },
    }),
  )
  return Boolean(result.Item?.isAdmin)
}

export async function resolveRequesterAccess(event: APIGatewayProxyEventV2): Promise<{
  userId: string | null
  isAdmin: boolean
}> {
  const userId = await getOptionalUserId(event)
  if (!userId) return { userId: null, isAdmin: false }
  const isAdmin = await isUserAdmin(userId)
  return { userId, isAdmin }
}
